window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    effectInput = null,
    wetGain = null,
    dryGain = null,
    outputMix = null,
    currentEffectNode = null,
    reverbBuffer = null,
    dtime = null,
    dregen = null,
    lfo = null,
    cspeed = null,
    cdelay = null,
    cdepth = null,
    scspeed = null,
    scldelay = null,
    scrdelay = null,
    scldepth = null,
    scrdepth = null,
    fldelay = null,
    flspeed = null,
    fldepth = null,
    flfb = null,
    sflldelay = null,
    sflrdelay = null,
    sflspeed = null,
    sflldepth = null,
    sflrdepth = null,
    sfllfb = null,
    sflrfb = null,
    rmod = null,
    mddelay = null,
    mddepth = null,
    mdspeed = null,
    lplfo = null,
    lplfodepth = null,
    lplfofilter = null,
    awFollower = null,
    awDepth = null,
    awFilter = null,
    ngFollower = null,
    ngGate = null,
    bitCrusher = null,
    btcrBits = 16,   // between 1 and 16
    btcrNormFreq = 1; // between 0.0 and 1.0

function Effect()
{
	this.controls = [];
	this.input = null;
	this.output = null;
}

Effect.prototype.addLinearControls = function( params, name, min, max, step, initial )
{
	//	[leftDelay.delayTime, rightDelay.delayTime], "Delay", 0.01, 2.0, 0.01, delayTime )
}
function EffectControl(type, min, max, initial, values)
{

}


var rafID = null;
var analyser1;
var analyserView1;
var constraints =
{
  audio: {
      optional: [{ echoCancellation: false }]
  }
};

function convertToMono( input )
{
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;

function cancelAnalyserUpdates() {
    if (rafID)
        window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    analyserView1.doFrequencyAnalysis( analyser1 );
    analyserView2.doFrequencyAnalysis( analyser2 );

    rafID = window.requestAnimationFrame( updateAnalysers );
}

// audio graph for ping pong effect : https://drive.google.com/file/d/1NEvvDpofNFh1HISDvB5q-vxvtRR7tPMn/view?usp=sharing

function createPingPongDelay(context, isTrueStereo, delayTime, feedback)
{
    // effect object created: refer effect.js
    var effect = new Effect();

    // heads up for the upcoming methods:
    // createChannelMerger: creates ChannelMergerNode (combines channel from multiple audio streams into single audio stream)
    // createChannelSplitter: creates ChannelSplitterNode (used to access the individual channels of an audio stream and process them separately)
    // createGain: creates GainNode which can be used to control the overall gain (or volume) of the audio graph
    // createDelay: creates DelayNode which is used to delay the incoming audio signal by a certain amount of time
    var merger = context.createChannelMerger(2);
    var leftDelay = context.createDelay();
    var rightDelay = context.createDelay();
    var leftFeedback = audioContext.createGain();
    var rightFeedback = audioContext.createGain();
    var splitter = context.createChannelSplitter(2);

    // Split the stereo signal
    // connect params: destination, outputIndex, inputIndex
    splitter.connect(leftDelay, 0);

    // If the signal is dual copies of a mono signal, we don't want the right channel -
    // it will just sound like a mono delay.  If it was a real stereo signal, we do want
    // it to just mirror the channels.
    if (isTrueStereo)
        splitter.connect( rightDelay, 1 );

    // delays both nodes by "delaytime"
    leftDelay.delayTime.value = delayTime;
    rightDelay.delayTime.value = delayTime;

    // applies gain based on the values passed as "feedback"
    leftFeedback.gain.value = feedback;
    rightFeedback.gain.value = feedback;

    // Connect the routing - left bounces to right, right bounces to left.
    leftDelay.connect(leftFeedback);
    leftFeedback.connect(rightDelay);

    rightDelay.connect(rightFeedback);
    rightFeedback.connect(leftDelay);

    // Re-merge the two delay channels into stereo L/R
    leftFeedback.connect(merger, 0, 0);
    rightFeedback.connect(merger, 0, 1);

    effect.addLinearControls( [leftDelay.delayTime, rightDelay.delayTime], "Delay", 0.01, 2.0, 0.01, delayTime );
    effect.addLinearControls( [leftFeedback.gain, rightFeedback.gain], "Feedback", 0.01, 1.0, 0.01, feedback );

    effect.input = splitter;
    effect.output = merger;
    return effect;
}


var lpInputFilter=null;

// this is ONLY because we have massive feedback without filtering out
// the top end in live speaker scenarios.
function createLPInputFilter()
{
    lpInputFilter = audioContext.createBiquadFilter();
    lpInputFilter.frequency.value = 2048;
    return lpInputFilter;
}


function toggleMono()
{
    if (audioInput != realAudioInput)
    {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    }
    else
    {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    createLPInputFilter();
    lpInputFilter.connect(dryGain);
    lpInputFilter.connect(analyser1);
    lpInputFilter.connect(effectInput);
}

var useFeedbackReduction = true;

function gotStream(stream)
{
    // Create an AudioNode from the stream.
    // realAudioInput = audioContext.createMediaStreamSource(stream);
    var input = audioContext.createMediaStreamSource(stream);

/*
    realAudioInput = audioContext.createBiquadFilter();
    realAudioInput.frequency.value = 60.0;
    realAudioInput.type = realAudioInput.NOTCH;
    realAudioInput.Q = 10.0;

    input.connect( realAudioInput );
*/
    audioInput = convertToMono( input );

    if (useFeedbackReduction)
    {
        audioInput.connect( createLPInputFilter() );
        audioInput = lpInputFilter;
    }

    // create mix gain nodes
    outputMix = audioContext.createGain();
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();
    effectInput = audioContext.createGain();
    audioInput.connect(dryGain);
    audioInput.connect(analyser1);
    audioInput.connect(effectInput);
    dryGain.connect(outputMix);
    wetGain.connect(outputMix);
    outputMix.connect( audioContext.destination);
    outputMix.connect(analyser2);
    crossfade(1.0);
    changeEffect();
    cancelAnalyserUpdates();
    updateAnalysers();
}

function changeInput(){
  if (!!window.stream) {
    window.stream.stop();
  }
  var audioSelect = document.getElementById("audioinput");
  var audioSource = audioSelect.value;
  constraints.audio.optional.push({sourceId: audioSource});

  navigator.getUserMedia(constraints, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

function gotSources(sourceInfos) {
    var audioSelect = document.getElementById("audioinput");
    while (audioSelect.firstChild)
        audioSelect.removeChild(audioSelect.firstChild);

    for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'audio') {
            var option = document.createElement("option");
            option.value = sourceInfo.id;
            option.text = sourceInfo.label || 'input ' + (audioSelect.length + 1);
            audioSelect.appendChild(option);
        }
    }
    audioSelect.onchange = changeInput;
}

function initAudio() {
    var irRRequest = new XMLHttpRequest();
    irRRequest.open("GET", "sounds/cardiod-rear-levelled.wav", true);
    irRRequest.responseType = "arraybuffer";
    irRRequest.onload = function() {
        audioContext.decodeAudioData( irRRequest.response,
            function(buffer) { reverbBuffer = buffer; } );
    }
    irRRequest.send();

    o3djs.require('o3djs.shader');

    analyser1 = audioContext.createAnalyser();
    analyser1.fftSize = 1024;
    analyser2 = audioContext.createAnalyser();
    analyser2.fftSize = 1024;

    analyserView1 = new AnalyserView("view1");
    analyserView1.initByteBuffer( analyser1 );
    analyserView2 = new AnalyserView("view2");
    analyserView2.initByteBuffer( analyser2 );

    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    if (!navigator.getUserMedia)
        return(alert("Error: getUserMedia not supported!"));

    navigator.getUserMedia(constraints, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });

    if ((typeof MediaStreamTrack === 'undefined')||(!MediaStreamTrack.getSources)){
        console.log("This browser does not support MediaStreamTrack, so doesn't support selecting sources.\n\nTry Chrome Canary.");
    } else {
        MediaStreamTrack.getSources(gotSources);
    }

    document.getElementById("effect").onchange=changeEffect;
}

function keyPress(ev) {
    var oldEffect = document.getElementById("effect").selectedIndex;
    var newEffect = oldEffect;
    switch (ev.keyCode) {
      case 50: // 'r'
        newEffect = 1;
        break;
      case 49: // 'c'
        newEffect = 8;
        break;
      case 51: // 'p'
        newEffect = 10;
        break;
      default:
        console.log(ev.keyCode);
    }
    if (newEffect != oldEffect) {
        document.getElementById("effect").selectedIndex = newEffect;
        changeEffect();
    }
}

window.addEventListener('load', initAudio );

window.addEventListener('keydown', keyPress );

function crossfade(value) {
  // equal-power crossfade
  var gain1 = Math.cos(value * 0.5*Math.PI);
  var gain2 = Math.cos((1.0-value) * 0.5*Math.PI);

  dryGain.gain.value = gain1;
  wetGain.gain.value = gain2;
}

var lastEffect = -1;

function changeEffect() {
    lfo = null;
    dtime = null;
    dregen = null;
    cspeed = null;
    cdelay = null;
    cdepth = null;
    rmod = null;
    fldelay = null;
    flspeed = null;
    fldepth = null;
    flfb = null;
    scspeed = null;
    scldelay = null;
    scrdelay = null;
    scldepth = null;
    scrdepth = null;
    sflldelay = null;
    sflrdelay = null;
    sflspeed = null;
    sflldepth = null;
    sflrdepth = null;
    sfllfb = null;
    sflrfb = null;
    rmod = null;
    mddelay = null;
    mddepth = null;
    mdspeed = null;
    lplfo = null;
    lplfodepth = null;
    lplfofilter = null;
    awFollower = null;
    awDepth = null;
    awFilter = null;
    ngFollower = null;
    ngGate = null;
    bitCrusher = null;

    if (currentEffectNode)
        currentEffectNode.disconnect();
    if (effectInput)
        effectInput.disconnect();

    var effect = document.getElementById("effect").selectedIndex;
    var effectControls = document.getElementById("controls");
    if (lastEffect > -1)
        effectControls.children[lastEffect].classList.remove("display");
    lastEffect = effect;
    effectControls.children[effect].classList.add("display");

    switch (effect) {
        case 0: // Delay
            currentEffectNode = createDelay();
            break;
        case 1: // Telephone
            currentEffectNode = createTelephonizer();
            break;
        case 2: // Pitch shifting
            currentEffectNode = createPitchShifter();
            break;
        case 3: // Ping-pong delay
            var pingPong = createPingPongDelay(audioContext, (audioInput == realAudioInput), 0.3, 0.4 );
            pingPong.output.connect( wetGain );
            currentEffectNode = pingPong.input;
            break;
        default:
            break;
    }
    audioInput.connect( currentEffectNode );
}




function createTelephonizer() {
    // I double up the filters to get a 4th-order filter = faster fall-off
    var lpf1 = audioContext.createBiquadFilter();
    lpf1.type = "lowpass";
    lpf1.frequency.value = 2000.0;
    var lpf2 = audioContext.createBiquadFilter();
    lpf2.type = "lowpass";
    lpf2.frequency.value = 2000.0;
    var hpf1 = audioContext.createBiquadFilter();
    hpf1.type = "highpass";
    hpf1.frequency.value = 500.0;
    var hpf2 = audioContext.createBiquadFilter();
    hpf2.type = "highpass";
    hpf2.frequency.value = 500.0;
    lpf1.connect( lpf2 );
    lpf2.connect( hpf1 );
    hpf1.connect( hpf2 );
    hpf2.connect( wetGain );
    currentEffectNode = lpf1;
    return( lpf1 );
}

function createDelay() {
    var delayNode = audioContext.createDelay();

    delayNode.delayTime.value = parseFloat( document.getElementById("dtime").value );
    dtime = delayNode;

    var gainNode = audioContext.createGain();
    gainNode.gain.value = parseFloat( document.getElementById("dregen").value );
    dregen = gainNode;

    gainNode.connect( delayNode );
    delayNode.connect( gainNode );
    delayNode.connect( wetGain );

    return delayNode;
}

function createReverb() {
    var convolver = audioContext.createConvolver();
    convolver.buffer = reverbBuffer; // impulseResponse( 2.5, 2.0 );  // reverbBuffer;
    convolver.connect( wetGain );
    return convolver;
}

var waveshaper = null;

var awg = null;

function createPitchShifter() {
    effect = new Jungle( audioContext );
    effect.output.connect( wetGain );
    return effect.input;
}

btcrBits = 16,
    btcrNormFreq

function impulseResponse( duration, decay, reverse ) {
    var sampleRate = audioContext.sampleRate;
    var length = sampleRate * duration;
    var impulse = audioContext.createBuffer(2, length, sampleRate);
    var impulseL = impulse.getChannelData(0);
    var impulseR = impulse.getChannelData(1);

    if (!decay)
        decay = 2.0;
    for (var i = 0; i < length; i++){
      var n = reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
}

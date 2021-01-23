function toggleMic()
{
    var banned = document.getElementById("micBan").getAttribute("class");
    if(banned == null)
    {
        document.getElementById("micBan").setAttribute("class", "fas fa-ban fa-stack-2x");
        if(outputMix != null)
        {
            outputMix.gain.value = 0;
        }
    }
    else
    {
        document.getElementById("micBan").removeAttribute("class");
        if(outputMix != null)
        {
            outputMix.gain.value = 1;
        }
    }
}

var max_height = Math.max($(".other_controls").height(), Math.max($(".av_stream").height(), $(".emotions_options").height()));
$(".other_controls").height(max_height);
$(".av_stream").height(max_height);
$(".emotions_options").height(max_height);

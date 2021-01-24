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

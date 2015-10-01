var videos = {
        a: Popcorn("#videoA"),
        b: Popcorn("#videoB"),
    },
    playtime = $("#playtime"),
    playToggle = $("#playToggle"),
    volumeA = $("#volumeA"),
    volumeB = $("#volumeB"),
    loadCount = 0,
    events = "play pause timeupdate seeking".split(/\s+/g);

playtime.attr("max", Math.min(videos.a.duration(), videos.b.duration()));
// iterate both media sources
Popcorn.forEach(videos, function(media, type) {

    // when each is ready... 
    media.on("canplayall", function() {

        // trigger a custom "sync" event
        this.emit("sync");
	
	console.log(this.duration());

        // Listen for the custom sync event...    
    }).on("sync", function() {

        // Once both items are loaded, sync events
        if (++loadCount == 2) {

            // Iterate all events and trigger them on the video B
            // whenever they occur on the video A
            events.forEach(function(event) {

                videos.a.on(event, function() {

                    // Avoid overkill events, trigger timeupdate manually
                    if (event === "timeupdate") {

                        if (!this.media.paused) {
                            return;
                        }
                        videos.b.emit("timeupdate");

                        // update playtime
                        console.log(this.currentTime());
                        playtime.val(this.currentTime());

                        return;
                    }

                    if (event === "seeking") {
                        videos.b.currentTime(this.currentTime());
                    }

                    if (event === "play" || event === "pause") {
                        videos.b[event]();
                    }
                });
            });
        }
    });
});

videos.a.on("timeupdate", function() {
    // Update the slider value
    playtime.val(videos.a.currentTime());
});

playtime.bind("change", function() {
    var val = this.value;
    videos.a.currentTime(val);
    videos.b.currentTime(val);
});


volumeA.change(function() {
    videos.a.volume = this.value;
});
volumeB.change(function() {
    videos.b.volume = this.value;
});

playToggle.change(function() {
    var isPlay = !$(this).prop('checked');

    if (isPlay) {
        videos.a.play();
    } else // pause
    {
        videos.a.pause();
    }
});

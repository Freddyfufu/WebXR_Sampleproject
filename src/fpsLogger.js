export class FPSLogger {
    constructor(title) {
        this.title = title;
        this.fpsValues = [];
        console.log("FPSLogger initialized, title: ", title);
    }

    startLogging() {
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
    }

    updateFPS() {
            const now = performance.now();
            this.frameCount++;
            if (now - this.lastFrameTime >= 1000) { // Alle 1 Sekunde berechnen
                const fps = this.frameCount;
                this.frameCount = 0;
                this.lastFrameTime = now;
                this.logFPS(fps);
            }
        };


    logFPS(fps) {
        const userAgent = navigator.userAgent;
        const timestamp = new Date().toISOString();
        const entry = `${this.title}    |   ${timestamp}     |     ${fps}    |    ${userAgent}\n`;
        this.fpsValues.push(entry);
        console.log(`FPS:${this.title} |  ${fps} | ${timestamp} | ${userAgent}`);
    }

    // saveToFile() {
    //     const csvHeader = "Timestamp,FPS,User-Agent\n";
    //     const blob = new Blob([csvHeader + this.fpsValues.join("   |   ")], { type: "text/csv" });
    //     const link = document.createElement("a");
    //     link.href = URL.createObjectURL(blob);
    //     link.download = "fps_log.csv";
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //     console.log("FPS-Daten wurden gespeichert.");
    // }
    getData() {
        console.log("FPS getData called");
        return this.fpsValues;
    }
}



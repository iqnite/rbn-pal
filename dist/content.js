"use strict";
class ContinentSnrTracker {
    constructor() {
        this.snapshots = [];
        this.separateByBand = true;
        this.controlsDiv = this.getOrCreateControlsDiv();
        this.continentPlotsDiv = ContinentSnrTracker.getOrCreateContinentPlotsDiv();
        this.separateByBandLabel = this.createSeparateByBandCheckbox();
    }
    getSnr(timestamp, continent, band) {
        return this.snapshots.find((s) => s.timestamp.getTime() === timestamp.getTime() &&
            s.continent === continent &&
            s.band === band)?.avgSnr;
    }
    addSnapshot(timestamp, continent, band, avgSnr) {
        this.snapshots.push({ timestamp, continent, band, avgSnr });
    }
    getUniqueTimes() {
        const times = new Set(this.snapshots.map((s) => s.timestamp.getTime()));
        return Array.from(times)
            .map((t) => new Date(t))
            .sort((a, b) => a.getTime() - b.getTime());
    }
    getUniqueContinents() {
        return Array.from(new Set(this.snapshots.map((s) => s.continent)));
    }
    getUniqueBandsForContinent(continent) {
        return Array.from(new Set(this.snapshots
            .filter((s) => s.continent === continent)
            .map((s) => s.band)));
    }
    main() {
        const lastData = ContinentSnrTracker.extractData();
        if (!lastData)
            return;
        const aggregatedData = ContinentSnrTracker.aggregateRowData(lastData);
        const timestamp = new Date();
        for (const continent of aggregatedData.keys()) {
            for (const band of aggregatedData.get(continent).keys()) {
                const bandSnrs = aggregatedData.get(continent).get(band);
                if (!bandSnrs)
                    continue;
                const avgSnr = ContinentSnrTracker.arrayAvg(bandSnrs);
                this.addSnapshot(timestamp, continent, band, avgSnr);
            }
        }
        const times = this.getUniqueTimes();
        const timeStrings = times.map((t) => t.toLocaleTimeString());
        const continents = this.getUniqueContinents();
        for (const continent of continents) {
            const traces = [];
            const bands = this.getUniqueBandsForContinent(continent);
            if (this.separateByBand) {
                for (const band of bands) {
                    const avgSnrs = times.map((t) => this.getSnr(t, continent, band) ?? NaN);
                    traces.push({
                        x: timeStrings,
                        y: avgSnrs,
                        type: "scatter",
                        mode: "lines+markers",
                        name: `${band}m`,
                        line: { color: ContinentSnrTracker.colorBand(band) },
                    });
                }
            }
            else {
                // Combine all bands into a single trace
                const allSnrs = times.map((t) => {
                    const snrsAtTime = bands
                        .map((b) => this.getSnr(t, continent, b))
                        .filter((snr) => snr !== undefined);
                    return snrsAtTime.length > 0
                        ? ContinentSnrTracker.arrayAvg(snrsAtTime)
                        : NaN;
                });
                traces.push({
                    x: timeStrings,
                    y: allSnrs,
                    type: "scatter",
                    mode: "lines+markers",
                    name: "All bands",
                    line: { color: "#1f77b4" },
                });
            }
            let continentDiv = document.getElementById(`rbnpal-continent-snr-plot-${continent}`);
            if (!continentDiv) {
                continentDiv =
                    ContinentSnrTracker.createContinentDiv(continent);
                const checkboxLabel = ContinentSnrTracker.createContinentCheckbox(continent);
                this.controlsDiv.appendChild(checkboxLabel);
                this.continentPlotsDiv.appendChild(continentDiv);
            }
            const layout = {
                title: { text: continent },
                xaxis: { title: { text: "Time" } },
                yaxis: { title: { text: "Avg SNR / dB" } },
                automargin: true,
                paper_bgcolor: "#fffeef",
            };
            Plotly.newPlot(`rbnpal-continent-snr-plot-${continent}`, traces, layout, { responsive: true });
        }
        // Only keep the latest 2 hours of data (12 snapshots at 10-minute intervals)
        const uniqueTimes = this.getUniqueTimes();
        if (uniqueTimes.length > 12) {
            const cutoffTime = uniqueTimes[uniqueTimes.length - 12];
            this.snapshots = this.snapshots.filter((s) => s.timestamp.getTime() >= cutoffTime.getTime());
        }
        const nextRefreshSec = this.snapshots.length > 0 ? 600 : 1;
        setTimeout(() => {
            this.main();
        }, nextRefreshSec * 1000);
    }
    getOrCreateControlsDiv() {
        let div = document.getElementById("rbnpal-controls");
        if (div) {
            return div;
        }
        div = document.createElement("div");
        div.id = "rbnpal-controls";
        const plotControlsTitle = document.createElement("h3");
        plotControlsTitle.textContent = "Average SNR over time by continent";
        const refreshButton = document.createElement("button");
        refreshButton.textContent = "Refresh";
        div.appendChild(plotControlsTitle);
        div.appendChild(refreshButton);
        refreshButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.main();
        });
        const cluster = document.getElementById("cluster");
        cluster?.appendChild(div);
        return div;
    }
    static getOrCreateContinentPlotsDiv() {
        let div = document.getElementById("rbnpal-continent-snr-plots");
        if (div) {
            return div;
        }
        div = document.createElement("div");
        div.id = "rbnpal-continent-snr-plots";
        div.style.width = "100%";
        div.style.display = "flex";
        div.style.flexDirection = "row";
        div.style.flexWrap = "wrap";
        div.style.gap = "10px";
        const cluster = document.getElementById("cluster");
        cluster?.appendChild(div);
        return div;
    }
    static createContinentDiv(continent) {
        const div = document.createElement("div");
        div.id = `rbnpal-continent-snr-plot-${continent}`;
        div.style.width = "30%";
        div.style.minWidth = "400px";
        div.style.height = "300px";
        return div;
    }
    static createContinentCheckbox(continent) {
        const label = document.createElement("label");
        label.style.marginRight = "10px";
        const checkbox = document.createElement("input");
        checkbox.id = `rbnpal-avg-snr-checkbox-${continent}`;
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.addEventListener("change", (e) => {
            ContinentSnrTracker.updateContinentDisplay(e, continent);
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(continent));
        return label;
    }
    createSeparateByBandCheckbox() {
        const label = document.createElement("label");
        label.style.marginRight = "10px";
        const checkbox = document.createElement("input");
        checkbox.id = `rbnpal-separate-by-band-checkbox`;
        checkbox.type = "checkbox";
        checkbox.checked = this.separateByBand;
        checkbox.addEventListener("change", (e) => this.updateBandSeparation(e));
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode("Separate by band"));
        this.controlsDiv.appendChild(label);
        return label;
    }
    static updateContinentDisplay(event, continent) {
        const checkbox = event.target;
        const continentDiv = document.getElementById(`rbnpal-continent-snr-plot-${continent}`);
        if (continentDiv) {
            continentDiv.style.display = checkbox.checked ? "block" : "none";
        }
    }
    updateBandSeparation(event) {
        const checkbox = event.target;
        this.separateByBand = checkbox.checked;
        this.main();
    }
    static extractData() {
        const regionRegex = /(.*) - (.*) - (.*) - (.*) - (.*)/;
        const snrRegex = /([0-9]+)/;
        const freqRegex = /([0-9]+).?[0-9]*/;
        const seenNowRegex = /.*now.*/;
        const spotsTable = document
            .getElementById("id_spots")
            ?.querySelector("tbody");
        const data = [];
        if (!spotsTable) {
            console.error("Spots table not found");
            return null;
        }
        for (const row of Array.from(spotsTable.rows)) {
            if (row.classList.contains("spots")) {
                const regionLink = row.children[0]?.lastElementChild;
                if (!(regionLink instanceof HTMLAnchorElement))
                    continue;
                const regionText = regionLink.title.match(regionRegex);
                const snrText = row.children[7].textContent.match(snrRegex);
                const freqText = row.children[4].textContent.match(freqRegex);
                const seenText = row.children[10].textContent.match(seenNowRegex);
                let continent = "??";
                let snr = NaN;
                let freq = NaN;
                if (regionText) {
                    continent = regionText[3];
                }
                if (snrText) {
                    snr = Number(snrText[1]);
                }
                if (freqText) {
                    freq = Number(freqText[1]);
                }
                if (!seenText) {
                    continue; // Only consider spots seen "now"
                }
                data.push(new DataRow(continent, freq, snr));
            }
        }
        return data;
    }
    static aggregateRowData(dataRows) {
        const continentData = new Map();
        for (const row of dataRows) {
            if (!continentData.has(row.continent)) {
                continentData.set(row.continent, new Map());
            }
            const continentMap = continentData.get(row.continent);
            const band = ContinentSnrTracker.matchBand(row.freq) ?? "other";
            if (!continentMap.has(band)) {
                continentMap.set(band, []);
            }
            const bandSnrs = continentMap.get(band);
            bandSnrs.push(row.snr);
        }
        return continentData;
    }
    static arrayAvg(arr) {
        const sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }
    static matchBand(freq) {
        const bands = {
            630: [470, 510],
            160: [1800, 1900],
            80: [3500, 3800],
            60: [5250, 5450],
            40: [7000, 7300],
            30: [10100, 10150],
            20: [14000, 14350],
            17: [18068, 18168],
            15: [21000, 22000],
            12: [24890, 24990],
            10: [28000, 30000],
            6: [50000, 54000],
            4: [70000, 72000],
            2: [144000, 148000],
        };
        for (const [band, range] of Object.entries(bands)) {
            if (freq >= range[0] && freq <= range[1]) {
                return band;
            }
        }
        return null;
    }
    static colorBand(band) {
        const bandColors = {
            630: "#AAAAAA",
            160: "#ffe000",
            80: "#093f00",
            60: "#777777",
            40: "#ffa500",
            30: "#ff0000",
            20: "#800080",
            17: "#0000ff",
            15: "#444444",
            12: "#00ffff",
            10: "#ff00ff",
            6: "#ffc0cb",
            4: "#a276ff",
            2: "#92ff7f",
        };
        return bandColors[band] ?? "#1f77b4";
    }
}
class DataRow {
    constructor(continent, freq, snr) {
        this.continent = continent;
        this.freq = freq;
        this.snr = snr;
    }
}
new ContinentSnrTracker().main();
//# sourceMappingURL=content.js.map
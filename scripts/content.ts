class ContinentSnrTracker {
    public continentSnrAvgs = new Map<string, Map<string, number>>();

    public main() {
        const continentSnrMap = ContinentSnrTracker.extractData();
        if (!continentSnrMap) return;

        const controlsDiv = this.getOrCreateControlsDiv();
        const continentPlotsDiv =
            ContinentSnrTracker.getOrCreateContinentPlotsDiv();

        const continents = Array.from(continentSnrMap.keys()).sort();
        for (const continent of continents) {
            let continentDiv = document.getElementById(
                `rbnpal-continent-snr-plot-${continent}`
            ) as HTMLDivElement | null;

            if (!continentDiv) {
                continentDiv =
                    ContinentSnrTracker.createContinentDiv(continent);
                const checkbox =
                    ContinentSnrTracker.createContinentCheckbox(continent);
                controlsDiv.appendChild(checkbox);
                continentPlotsDiv.appendChild(continentDiv);
            }

            const snrs = continentSnrMap.get(continent) || [];
            const averageSnr = ContinentSnrTracker.arrayAvg(snrs);
            if (!this.continentSnrAvgs.has(continent)) {
                this.continentSnrAvgs.set(continent, new Map());
            }

            const time = new Date().toLocaleTimeString();
            this.continentSnrAvgs.get(continent)!.set(time, averageSnr);
            const continentMap = this.continentSnrAvgs.get(continent)!;
            while (continentMap.size > 60) {
                const oldestKey = continentMap.keys().next().value;
                if (oldestKey === undefined) break;
                continentMap.delete(oldestKey);
            }

            const times = Array.from(
                this.continentSnrAvgs.get(continent)!.keys()
            );
            const avgSnrs = Array.from(
                this.continentSnrAvgs.get(continent)!.values()
            );
            const trace = {
                x: times,
                y: avgSnrs,
                type: "scatter" as const,
                mode: "lines+markers" as const,
                name: continent,
            };
            const layout = {
                title: { text: continent },
                xaxis: { title: { text: "Time" } },
                yaxis: { title: { text: "Avg SNR / dB" } },
                automargin: true,
                paper_bgcolor: "#fffeef",
            };
            Plotly.newPlot(
                `rbnpal-continent-snr-plot-${continent}`,
                [trace as Plotly.Data],
                layout,
                { responsive: true }
            );
        }

        setTimeout(() => {
            this.main();
        }, (this.continentSnrAvgs.size > 0 ? 600 : 10) * 1000);
    }

    public getOrCreateControlsDiv() {
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

    public static getOrCreateContinentPlotsDiv() {
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

    public static createContinentDiv(continent: string) {
        const div = document.createElement("div");
        div.id = `rbnpal-continent-snr-plot-${continent}`;
        div.style.width = "30%";
        div.style.minWidth = "400px";
        div.style.height = "300px";
        return div;
    }

    public static createContinentCheckbox(continent: string) {
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

    public static updateContinentDisplay(event: Event, continent: string) {
        const checkbox = event.target as HTMLInputElement;
        const continentDiv = document.getElementById(
            `rbnpal-continent-snr-plot-${continent}`
        );
        if (continentDiv) {
            continentDiv.style.display = checkbox.checked ? "block" : "none";
        }
    }

    public static extractData() {
        const regionRegex = /(.*) - (.*) - (.*) - (.*) - (.*)/;
        const snrRegex = /([0-9]+)/;
        const spotsTable = document
            .getElementById("id_spots")
            ?.querySelector("tbody");
        const continentSnrMap = new Map();

        if (!spotsTable) {
            console.error("Spots table not found");
            return;
        }

        for (const row of Array.from(spotsTable.rows)) {
            if (row.classList.contains("spots")) {
                const regionLink = row.children[0]?.lastElementChild;
                if (!(regionLink instanceof HTMLAnchorElement)) continue;
                const regionText = regionLink.title.match(regionRegex);
                const snrText = row.children[7].textContent.match(snrRegex);
                let continent = "??";
                let snr = NaN;
                if (regionText) {
                    continent = regionText[3];
                }
                if (snrText) {
                    snr = Number(snrText[1]);
                }
                if (!continentSnrMap.has(continent)) {
                    continentSnrMap.set(continent, []);
                }
                continentSnrMap.get(continent).push(snr);
            }
        }

        return continentSnrMap;
    }

    public static arrayAvg(arr: number[]) {
        const sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }

    public static matchBand(freq: number): string | null {
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
}

new ContinentSnrTracker().main();

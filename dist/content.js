"use strict";
function main(plotly, continentSnrAvgs) {
    continentSnrAvgs = continentSnrAvgs || new Map();
    const continentSnrMap = extractData();
    if (!continentSnrMap)
        return;
    const controlsDiv = getOrCreateControlsDiv();
    const continentPlotsDiv = getOrCreateContinentPlotsDiv();
    const continents = Array.from(continentSnrMap.keys()).sort();
    for (const continent of continents) {
        let continentDiv = document.getElementById(`rbnpal-continent-snr-plot-${continent}`);
        if (!continentDiv) {
            continentDiv = createContinentDiv(continent);
            const checkbox = createContinentCheckbox(continent);
            controlsDiv.appendChild(checkbox);
            continentPlotsDiv.appendChild(continentDiv);
        }
        const snrs = continentSnrMap.get(continent) || [];
        const averageSnr = arrayAvg(snrs);
        if (!continentSnrAvgs.has(continent)) {
            continentSnrAvgs.set(continent, new Map());
        }
        const time = new Date().toLocaleTimeString();
        continentSnrAvgs.get(continent).set(time, averageSnr);
        const continentMap = continentSnrAvgs.get(continent);
        while (continentMap.size > 60) {
            const oldestKey = continentMap.keys().next().value;
            if (oldestKey === undefined)
                break;
            continentMap.delete(oldestKey);
        }
        const times = Array.from(continentSnrAvgs.get(continent).keys());
        const avgSnrs = Array.from(continentSnrAvgs.get(continent).values());
        const trace = {
            x: times,
            y: avgSnrs,
            type: "scatter",
            mode: "lines+markers",
            name: continent,
        };
        const layout = {
            title: { text: continent },
            xaxis: { title: { text: "Time" } },
            yaxis: { title: { text: "Avg SNR / dB" } },
            automargin: true,
            paper_bgcolor: "#fffeef",
        };
        plotly.newPlot(`rbnpal-continent-snr-plot-${continent}`, [trace], layout, { responsive: true });
    }
    setTimeout(() => {
        main(plotly, continentSnrAvgs);
    }, (continentSnrAvgs.size > 0 ? 600 : 10) * 1000);
}
function getOrCreateControlsDiv() {
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
        main(Plotly);
    });
    const cluster = document.getElementById("cluster");
    cluster?.appendChild(div);
    return div;
}
function getOrCreateContinentPlotsDiv() {
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
function createContinentDiv(continent) {
    const div = document.createElement("div");
    div.id = `rbnpal-continent-snr-plot-${continent}`;
    div.style.width = "30%";
    div.style.minWidth = "400px";
    div.style.height = "300px";
    return div;
}
function createContinentCheckbox(continent) {
    const label = document.createElement("label");
    label.style.marginRight = "10px";
    const checkbox = document.createElement("input");
    checkbox.id = `rbnpal-avg-snr-checkbox-${continent}`;
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", (e) => {
        updateContinentDisplay(e, continent);
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(continent));
    return label;
}
function updateContinentDisplay(event, continent) {
    const checkbox = event.target;
    const continentDiv = document.getElementById(`rbnpal-continent-snr-plot-${continent}`);
    if (continentDiv) {
        continentDiv.style.display = checkbox.checked ? "block" : "none";
    }
}
function extractData() {
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
            if (!(regionLink instanceof HTMLAnchorElement))
                continue;
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
function arrayAvg(arr) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}
async function waitForPlotly(timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (window.Plotly) {
            return window.Plotly;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return null;
}
(async () => {
    const plotly = await waitForPlotly();
    if (!plotly) {
        console.error("Plotly failed to load within timeout");
        return;
    }
    main(plotly);
})();
//# sourceMappingURL=content.js.map
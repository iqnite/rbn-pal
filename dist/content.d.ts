declare function main(plotly: typeof Plotly, continentSnrAvgs?: Map<string, Map<string, number>>): void;
declare function getOrCreateControlsDiv(): HTMLElement;
declare function getOrCreateContinentPlotsDiv(): HTMLElement;
declare function createContinentDiv(continent: string): HTMLDivElement;
declare function createContinentCheckbox(continent: string): HTMLLabelElement;
declare function updateContinentDisplay(event: Event, continent: string): void;
declare function extractData(): Map<any, any> | undefined;
declare function arrayAvg(arr: number[]): number;
declare function waitForPlotly(timeout?: number): Promise<typeof Plotly | null>;

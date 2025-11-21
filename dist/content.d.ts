interface SnrSnapshot {
    timestamp: Date;
    continent: string;
    band: string;
    avgSnr: number;
}
declare class ContinentSnrTracker {
    private snapshots;
    private separateByBand;
    private controlsDiv;
    private continentPlotsDiv;
    private separateByBandLabel;
    private getSnr;
    private addSnapshot;
    private getUniqueTimes;
    private getUniqueContinents;
    private getUniqueBandsForContinent;
    main(): void;
    getOrCreateControlsDiv(): HTMLDivElement;
    static getOrCreateContinentPlotsDiv(): HTMLDivElement;
    static createContinentDiv(continent: string): HTMLDivElement;
    static createContinentCheckbox(continent: string): HTMLLabelElement;
    createSeparateByBandCheckbox(): HTMLLabelElement;
    static updateContinentDisplay(event: Event, continent: string): void;
    updateBandSeparation(event: Event): void;
    static extractData(): DataRow[] | null;
    static aggregateRowData(dataRows: DataRow[]): Map<string, // continent
    Map<string, // band
    number[]>>;
    static arrayAvg(arr: number[]): number;
    static matchBand(freq: number): string | null;
    static colorBand(band: string): string;
}
declare class DataRow {
    continent: string;
    freq: number;
    snr: number;
    constructor(continent: string, freq: number, snr: number);
}

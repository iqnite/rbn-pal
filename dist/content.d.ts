interface SnrSnapshot {
    timestamp: Date;
    continent: string;
    band: string;
    avgSnr: number;
}
declare class ContinentSnrTracker {
    private snapshots;
    private getSnr;
    private addSnapshot;
    private getUniqueTimes;
    private getUniqueContinents;
    private getUniqueBandsForContinent;
    main(): void;
    getOrCreateControlsDiv(): HTMLElement;
    static getOrCreateContinentPlotsDiv(): HTMLElement;
    static createContinentDiv(continent: string): HTMLDivElement;
    static createContinentCheckbox(continent: string): HTMLLabelElement;
    static updateContinentDisplay(event: Event, continent: string): void;
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

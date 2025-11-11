declare class ContinentSnrTracker {
    continentSnrAvgs: Map<string, Map<string, number>>;
    main(): void;
    getOrCreateControlsDiv(): HTMLElement;
    static getOrCreateContinentPlotsDiv(): HTMLElement;
    static createContinentDiv(continent: string): HTMLDivElement;
    static createContinentCheckbox(continent: string): HTMLLabelElement;
    static updateContinentDisplay(event: Event, continent: string): void;
    static extractData(): Map<any, any> | undefined;
    static arrayAvg(arr: number[]): number;
}

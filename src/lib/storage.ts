import {readFileSync, writeFileSync, existsSync} from "fs";
import { join } from "path";

interface StorageData {
    chromosomes: number[][];
}

export class Storage {
    private readonly filePath: string;

    constructor(filePath: string) {
        this.filePath = join(process.cwd(),'data', filePath);
    }



    save(chromosomes: number[][]) {
        const data: StorageData = {
            chromosomes
        };
        writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    load(): number[][] {
        try {
            if (!existsSync(this.filePath)) {
                return [];
            }
            const data: StorageData = JSON.parse(readFileSync(this.filePath, 'utf-8'));
            return data.chromosomes;
        } catch (error) {
            console.error("Error loading chromosomes:", error);
            return [];
        }
    }
}

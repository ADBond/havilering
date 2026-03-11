import { flawedSmallModelEncoder } from "./encode";

export const modelCatalogue = {
    velvet_swimming: {
        folder: "velvet_swimming",
        encoder: flawedSmallModelEncoder,
    },
}
export type modelName = keyof typeof modelCatalogue;

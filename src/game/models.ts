import { smallModelEncoder } from "./encode";

export const modelCatalogue = {
    velvet_swimming: {
        folder: "velvet_swimming",
        encoder: smallModelEncoder,
    },
}
export type modelName = keyof typeof modelCatalogue;

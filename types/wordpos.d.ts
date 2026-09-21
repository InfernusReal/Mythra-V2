declare module "wordpos" {
  export interface WordPosPointer { pointerSymbol: string; synsetOffset: string; pos: string; sourceTarget: string }
  export interface WordPosSense { synsetOffset: string; lexName: string; pos: string; lemma: string; synonyms: string[]; ptrs: WordPosPointer[]; def: string; exp: string[] }
  export default class WordPOS {
    constructor(options?: { stopwords?: boolean; profile?: boolean; debug?: boolean });
    lookup(word: string): Promise<WordPosSense[]>;
    seek(offset: string | number, pos: string): Promise<WordPosSense>;
  }
}

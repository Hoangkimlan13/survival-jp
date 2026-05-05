import "server-only"
import kuromoji from "kuromoji"
import path from "path"

let tokenizer: any = null
let initPromise: Promise<any> | null = null

export function getTokenizer() {
  if (tokenizer) return Promise.resolve(tokenizer)

  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      const dicPath = path.resolve(
        process.cwd(),
        "node_modules/kuromoji/dict"
      )

      kuromoji
        .builder({ dicPath })
        .build((err: any, t: any) => {
          if (err) return reject(err)
          tokenizer = t
          resolve(tokenizer)
        })
    })
  }

  return initPromise
}
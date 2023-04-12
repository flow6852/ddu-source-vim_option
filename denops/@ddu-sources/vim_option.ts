import {
  BaseSource,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v2.7.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.7.0/deps.ts";

// type Params = Record<never, never>;
type Params = {
  bufnr: number
}

export class Source extends BaseSource<Params> {
  override kind = "vim_variable";

  override gather(args: {
    denops: Denops;
    sourceOptions: SourceOptions;
    sourceParams: Params;
  }): ReadableStream<Item[]> {
    return new ReadableStream<Item[]>({
      async start(controller) {
        let bufnr = args.sourceParams.bufnr;
        if (bufnr < 1) {
          bufnr = await fn.bufnr(args.denops, "%") as number;
        }
        controller.enqueue(await getOptions(args.denops, args.sourceParams.bufnr))
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      bufnr: 0
    }
  }
}

async function getOptions(denops: Denops, bufnr: number) {
  const items: Item[] = [];
  for (
    const item of await fn.getcompletion(
      denops,
      "",
      "option",
    ) as Array<string>
  ) {
    if (item == "all") continue;
    const value = await fn.getbufvar(
      denops,
      bufnr,
      "&" + item,
    );
    items.push({
      word: item,
      action: {
        value: value,
        type: "option"
      },
    });
  }
  return items;
}

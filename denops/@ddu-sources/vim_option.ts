import {
  BaseSource,
  Context,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.6.0/mod.ts";

// type Params = Record<never, never>;
type Params = {
  bufnr: number;
};

export class Source extends BaseSource<Params> {
  override kind = "vim_type";

  override gather(args: {
    denops: Denops;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    context: Context;
  }): ReadableStream<Item[]> {
    return new ReadableStream<Item[]>({
      async start(controller) {
        let bufnr = args.sourceParams.bufnr;
        if (bufnr < 1) {
          bufnr = args.context.bufNr;
        }
        controller.enqueue(
          await getOptions(args.denops, args.sourceParams.bufnr),
        );
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      bufnr: 0,
    };
  }
}

async function getOptions(denops: Denops, bufnr: number) {
  const items: Item[] = [];
  const optionItems = await fn.getcompletion(
      denops,
      "",
      "option",
    )
    assert(optionItems, is.ArrayOf(is.String))
  for (
    const item of optionItems
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
        type: "option",
      },
    });
  }
  return items;
}

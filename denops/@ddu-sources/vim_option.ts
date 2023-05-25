import {
  BaseSource,
  Context,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v2.8.3/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.8.3/deps.ts";

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
        type: "option",
      },
    });
  }
  return items;
}

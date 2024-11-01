import { For, createSignal } from "solid-js";
import { SearchResponse } from "./api/search";

export default function Home() {
  let fileInput: HTMLInputElement | null = null;

  const [loading, setLoading] = createSignal(false);
  const [indexing, setIndexing] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchResponse>([]);

  const updateSearchResults = async () => {
    setLoading(true);
    const response = await fetch(`/api/search?q=${query()}`);
    setResults(await response.json());
    setLoading(false);
  };

  const getScoreClasses = (score: number) => {
    let points = 3;
    if (score < 0.78) points = 1;
    else if (score < 0.8) points = 2;

    const color =
      points === 1
        ? "bg-red-300"
        : points === 2
        ? "bg-yellow-300"
        : "bg-green-300";

    let classes = [];

    for (let i = 0; i < 3; i++) {
      if (i <= points - 1) classes.push(color);
      else classes.push("bg-gray-100");
    }

    return classes;
  };

  const indexCSVFile = async () => {
    if (!fileInput?.files?.length) return alert("No file selected");
    const file = fileInput.files[0];
    const text = await file.text();
    const lines = text.split("\n");

    const promtResult = prompt(`
    ${lines.length} lines
    How many lines would you like to index?
    `);

    const linesToIndex = parseInt(promtResult || "");
    if (!linesToIndex || isNaN(linesToIndex)) return alert("Canceled");
    const csvToIndex = lines.slice(0, linesToIndex + 1).join("\n");

    setIndexing(true);
    const transformResponse = await fetch("/api/transform", {
      method: "POST",
      body: csvToIndex,
    });

    const indexResponse = await fetch("/api/update-index", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(await transformResponse.json()),
    });

    setIndexing(false);

    console.log(indexResponse);
  };

  return (
    <div class="h-screen" classList={{ "opacity-50": loading() }}>
      <div class="relative w-full">
        <input
          type="text"
          placeholder="Long business trip to great britain by plain in economy class without return flight..."
          class="block p-12 pl-40 w-full outline-none text-lg text-gray-700 font-medium"
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyPress={(e) => e.code === "Enter" && updateSearchResults()}
        />
        <div class="absolute top-0 bottom-0 left-12 right-12 pointer-events-none flex gap-4 items-center justify-between font-medium text-gray-500">
          <span>Activity →</span>
          <button
            onClick={updateSearchResults}
            class="pointer-events-auto bg-black text-white ml-auto py-2 px-4 hover:border hover:border-black hover:border-solid hover:bg-white hover:text-black"
            disabled={loading()}
          >
            {loading() ? "Searching..." : "Search"}
          </button>
          <input
            id="upload"
            class="hidden"
            type="file"
            accept=".csv"
            ref={fileInput!}
            onInput={indexCSVFile}
          />
          <label
            for="upload"
            class="pointer-events-auto py-2 px-4 border border-transparent hover:text-black"
          >
            {indexing() ? "Indexing CSV file..." : "Upload CSV"}
          </label>
        </div>
      </div>
      <div class="h-2 bg-gray-100"></div>

      <div class="py-12 px-6 grid">
        <For each={results()}>
          {(result) => (
            <div class="grid gap-2 cursor-pointer px-6 py-10 hover:bg-gray-100">
              <h3 class="font-medium">
                {Object.keys(result.metadata)
                  .map((key) => result.metadata[key])
                  .join(" — ")}
              </h3>
              <div class="flex items-center">
                <div class="flex gap-1">
                  <For each={getScoreClasses(result.score)}>
                    {(cls) => <div class={`h-2 w-6 ${cls}`} />}
                  </For>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

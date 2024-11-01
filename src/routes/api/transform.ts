import { APIEvent, json } from "solid-start/api";

export const POST = async (event: APIEvent) => {
  const csv = await event.request.text();

  const lines = csv.split("\n");

  console.log("Transforming lines:", lines.length);

  const header = lines
    .shift()
    ?.split(",")
    .map((header) => header.trim());

  if (!header) return json([]);

  const objects = lines
    .map((line) =>
      line
        .split(",")
        .map((cell) => cell.trim())
        .reduce((object, cell, index) => {
          object[header[index]] = cell;
          return object;
        }, {} as Record<string, any>)
    )
    // .map((object) => ({ ...object, Value: parseFloat(object.Value) }))
    // .filter((object) => !isNaN(object.Value));

  console.log(
    "Reduced to objects:",
    objects.length,
    "-",
    lines.length - objects.length,
    "lines without value"
  );

  return json(objects);
};

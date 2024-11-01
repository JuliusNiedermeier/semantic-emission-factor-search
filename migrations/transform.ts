import { readFileSync } from "fs";
import { resolve } from "path";

export const transform = () => {
  const path = resolve(
    __dirname,
    "ghg-conversion-factors-2022-flat-format.csv"
  );

  console.log(path);

  const csv = readFileSync(path, "utf-8");

  console.log(csv);

  const lines = csv.split("\n");

  console.log("Transforming lines:", lines.length);

  const header = lines
    .shift()
    ?.split(",")
    .map((header) => header.trim());

  if (!header) return null;

  const objects = lines.map((line) =>
    line
      .split(",")
      .map((cell) => cell.trim())
      .reduce((object, cell, index) => {
        object[header[index]] = cell;
        return object;
      }, {} as Record<string, any>)
  );

  return objects;
};

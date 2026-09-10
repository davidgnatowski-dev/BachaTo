import { fetchSchoolCoverImage } from "../lib/schoolImageFetch";
import { SCHOOL_INFO } from "../lib/schools";

async function main() {
  for (const [name, info] of Object.entries(SCHOOL_INFO)) {
    try {
      const result = await fetchSchoolCoverImage(info.homepage);
      if (result) {
        console.log(`${name}: [${result.source}] ${result.url}`);
      } else {
        console.log(`${name}: brak sensownego zdjęcia`);
      }
    } catch (err) {
      console.log(`${name}: błąd — ${(err as Error).message}`);
    }
  }
}

main();

const key = "AIzaSyCDF0QfHB8s9FgvU4sjv2lzV8U4PuCtwUI";
const models = [
"gemini-2.5-flash",
"gemini-2.5-pro",
"gemini-2.0-flash",
"gemini-2.0-flash-001",
"gemini-2.0-flash-lite-001",
"gemini-2.0-flash-lite",
"gemini-flash-latest",
"gemini-flash-lite-latest"
]

async function run() {
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ contents: [{role:"user", parts:[{text:"hi"}]}] })
    });
    console.log("Model:", model, "->", res.status);
    if (res.status === 200) {
      console.log("FOUND WORKING MODEL:", model);
      break;
    }
  }
}
run();

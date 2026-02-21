import json
from datetime import datetime

import torch
from diffusers import Flux2KleinPipeline

device = "mps"
dtype = torch.bfloat16

pipe = Flux2KleinPipeline.from_pretrained("black-forest-labs/FLUX.2-klein-base-9B", torch_dtype=dtype)
pipe.to(device)

PROMPT_FILE = "prompt.txt"
CONFIG_FILE = "config.json"

DEFAULT_CONFIG = { # set the config overrides in config.json
    "height": 512,
    "width": 512,
    "guidance_scale": 4.0,
    "num_inference_steps": 4,
    "seed": None,
}


def load_config() -> dict:
    """Load config from file, merging with defaults. Returns defaults if file missing or invalid."""
    try:
        with open(CONFIG_FILE, "r") as file:
            user_config = json.load(file)
    except FileNotFoundError:
        return DEFAULT_CONFIG.copy()
    except json.JSONDecodeError as error:
        print(f"Error: {CONFIG_FILE} invalid JSON: {error}")
        return DEFAULT_CONFIG.copy()

    config = DEFAULT_CONFIG.copy()
    for key in config:
        if key in user_config and user_config[key] is not None:
            config[key] = user_config[key]
    return config


while True:
    input("Press Enter to generate (Ctrl+C to exit): ")

    config = load_config()

    try:
        with open(PROMPT_FILE, "r") as file:
            prompt = file.read().strip()
    except FileNotFoundError:
        print(f"Error: {PROMPT_FILE} not found. Create it and add your prompt.")
        continue

    if not prompt:
        print(f"Error: {PROMPT_FILE} is empty. Add your prompt.")
        continue

    seed = config["seed"] if config["seed"] is not None else int(datetime.now().timestamp())
    image = pipe(
        prompt=prompt,
        height=config["height"],
        width=config["width"],
        guidance_scale=config["guidance_scale"],
        num_inference_steps=config["num_inference_steps"],
        generator=torch.Generator(device=device).manual_seed(seed),
    ).images[0]

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    model = pipe.model_name.split("klein-")[-1]
    filepath = f"images/flux-klein-{timestamp_str}-{model}-inf{config['num_inference_steps']}.png"
    image.save(filepath)
    print(f"Saved {filepath}")

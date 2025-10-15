#!/bin/bash
# This script acts as the default shell for the dev container,
# ensuring that any new terminal automatically starts inside the Nix environment.
nix-shell --run bash


# This file is a bridge to make the IDX-specific .idx/dev.nix file
# work with a standard `nix-shell` for local development in a dev container.

# 1. Import nixpkgs. We are defaulting to the unstable channel.
let pkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-unstable.tar.gz") {};

# 2. Import the IDX configuration file, which is a function.
  idxConfigFunc = import ./.idx/dev.nix;

# 3. Call the function, providing the pkgs argument it needs.
  idxConfig = idxConfigFunc { inherit pkgs; };

# 4. Convert the env attribute set to a string of export commands for the shellHook.
  envVars = pkgs.lib.mapAttrsToList (name: value: "export ${name}='''${value}'''") idxConfig.env;
  shellHook = ''
    echo "--- Applying environment variables from .idx/dev.nix ---"
    ${pkgs.lib.concatStringsSep "
" envVars}
    echo "--- Environment loaded. ---"
  '';

# 5. Create a standard shell environment using mkShell.
in pkgs.mkShell {
  # Use the packages defined in the idx config.
  buildInputs = idxConfig.packages;

  # Use the environment variables from the idx config.
  shellHook = shellHook;
}

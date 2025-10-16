# This is the Nix configuration file for your project.
# It defines the development environment, including the packages and extensions that are installed.
# For more information, see the Nix documentation: https://nixos.org/manual/nix/stable/ 

{
  pkgs, 
  ... 
}: {
  # The channel determines which package versions are available.
  channel = "stable-24.05"; # You can also use "unstable"

  # A list of packages to install from the specified channel.
  # You can search for packages on the NixOS package search: https://search.nixos.org/packages
  packages = [
    pkgs.go # For the Go backend
    pkgs.nodejs_20 # For the Node.js frontend
    pkgs.sqlc # For generating database code
    pkgs.playwright # For Playwright end-to-end testing
  ];

  # A set of environment variables to define within the workspace.
  # env = {
  #   API_KEY = "your-secret-key";
  # };

  # VS Code extensions to install from the Open VSX Registry.
  # You can search for extensions on the Open VSX Registry: https://open-vsx.org/
  idx = {
    extensions = [
      "golang.go"
    ];

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        npm-install = "npm install --prefix apps/frontend";
      };

      # Runs every time the workspace is (re)started.
      onStart = {
        # Example: start a development server
        # start-server = "npm run dev";
      };
    };

    # Web previews for your application.
    # previews = {
    #   enable = true;
    #   previews = {
    #     web = {
    #       command = ["npm" "run" "dev" "--" "--port" "$PORT"];
    #       manager = "web";
    #     };
    #   };
    # };
  };
}

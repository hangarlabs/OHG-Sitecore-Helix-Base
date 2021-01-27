Step by step instructions on how to build and run a Sitecore website using helix pattern/principles.

1. Install a fresh instance of Sitecore inside intepub (IIS root folder).
   Recommended to split the VS project and Website hierarchy into different directories. e.g. Sitecore Website structure goes into a 'Sandbox' folder whereas the VS solution is placed outside of the container.
   Add new application pool, bindings in inetmgr.
   Update the host file by mapping the domain e.g. sc.dev.local onto localhost IP: 127.0.0.1

2. Setup a windows service for Solr (indexing)
   https://localhost:8983/solr/

3. Open a blank solution in Visual Studio

4. Create the 3 macro-architecture layers:
   a. Project - aesthetic layer where all features are stitched together into a cohesive way.
   b. Feature - Modules coupled together which define functionalities
      The rule of the thumb is: A feature module can’t reference other feature modules
      Method of composition should be favoured over inheritance (local groupings)
   c. Foundation - Lowest leaf but most stable... reusable functional code exists

The dlls have vertical dependency.

5. A source folder 'src' contains idem structure like the architecture (best practice for compilation).

6. Add Asp.Net Web Application project in each layers.
   Set web.config's build-action to 'None' and Copy To Local false to avoid messing up with the assembly versions.

7. Unicorn has been preferred over TDS as the serialization option.
   Configure the tool via Nuget package.

8. A View Rendering has been chosen to show how we pull items from the Sitecore tree and populate on a HTML page.

9. Append /Unicorn.aspx at end of your instance URL to start the synchronization.

10. Insert the corresponding folders in templates, renderings, placeholder settings and layouts nodes.

11. Copy binaries, configuration files and serialized items by means of publish profile.
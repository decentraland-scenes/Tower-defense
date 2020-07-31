## Tower defense game (WIP)

A fully-fledged game where a random 2d path is generated along which enemies walk, and where traps are randomly placed. You need to activate the traps as the enemies advance along the path to kill them. It’s all about timing.

![](screenshot/screenshot.png)

This scen shows you:

- How to handle the reusing of multiple entities using pools
- How to generate a random path that fulfills certain conditions
- How to move a character along a predetermined path
- How to keep a game's logic encapsulated in game objects, each with its own state and methods

> Note: This scene currently has bugs that need fixing. It still serves to show certain best practices.



## Try it out

**Install the CLI**

Download and install the Decentraland CLI by running the following command:

```bash
npm i -g decentraland
```

**Previewing the scene**

Download this example and navigate to its directory, then run:

```
$:  dcl start
```

Any dependencies are installed and then the CLI opens the scene in a new browser tab.

**Scene Usage**


Click the button on the rock to start a new game. Blob monsters will start to appear and walk along the path. Kill them by triggering both levers on a trap. Traps are active for a short period of time, so be careful with the timing. Once a trap is activated, another appears on a random spot along the path.

Learn more about how to build your own scenes in our [documentation](https://docs.decentraland.org/) site.

If something doesn’t work, please [file an issue](https://github.com/decentraland-scenes/Awesome-Repository/issues/new).

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.

using System;
using System.IO;
using System.Reflection;

// Run only on a newly created disposable root under the workspace .local folder.
internal static class SetupUXTests {
  static int Main(string[] args) {
    if (args.Length != 2) return 2;
    var workspace = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, ".local")) + Path.DirectorySeparatorChar;
    var root = Path.GetFullPath(args[1]);
    if (!root.StartsWith(workspace, StringComparison.OrdinalIgnoreCase) || Directory.Exists(root)) return 2;
    Directory.CreateDirectory(root);
    var data = Path.Combine(root, "@enturma", "desktop");
    var sibling = Path.Combine(root, "@enturma", "other-app");
    Directory.CreateDirectory(Path.Combine(data, "Cache")); Directory.CreateDirectory(sibling);
    File.WriteAllText(Path.Combine(data, "Cache", "fixture"), "synthetic");
    File.WriteAllText(Path.Combine(sibling, "keep"), "synthetic");
    var cleanup = Assembly.LoadFile(Path.GetFullPath(args[0])).GetType("SetupUX").GetMethod("RemoveLocalDataAt", BindingFlags.Static | BindingFlags.NonPublic);
    if ((int)cleanup.Invoke(null, new object[] { root }) != 0 || Directory.Exists(data)
        || !File.Exists(Path.Combine(sibling, "keep"))) return 1;
    if ((int)cleanup.Invoke(null, new object[] { root }) != 0) return 1;
    Console.WriteLine("PASS: fixed Electron directory removed, sibling preserved, repeat removal safe. Root: " + root);
    // Keep the tiny sibling fixture for inspection; never remove real app data.
    return 0;
  }
}

// Local Windows UI for NSIS. Installation remains owned by NSIS.
// Explicit uninstall consent permits removal of the fixed application data folder.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

internal sealed class SetupUX : Form {
  [DllImport("user32.dll")] static extern bool SystemParametersInfo(int action, int param, out bool value, int flags);
  [DllImport("user32.dll")] static extern bool ReleaseCapture();
  [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr hwnd, int msg, int wparam, int lparam);
  readonly Process installer;
  readonly Label heading = new Label(), detail = new Label();
  readonly Panel progress = new Panel();
  readonly Timer motionTimer = new Timer();
  readonly Button close = new Button();
  readonly Timer poll = new Timer();
  readonly PictureBox art = new PictureBox();
  readonly string mode;
  bool finished;
  MemoryStream imageBytes;

  [STAThread] static int Main(string[] args) {
    if (args.Length == 2 && args[0] == "--uninstall-options") return ConfirmUninstall(args[1]);
    if (args.Length == 1 && args[0] == "--remove-local-data") return RemoveLocalData();
    int pid;
    if (args.Length != 4 || !int.TryParse(args[1], out pid)) return 2;
    if (args[0] != "install" && args[0] != "update" && args[0] != "uninstall") return 2;
    try {
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      using (var form = new SetupUX(args[0], Process.GetProcessById(pid), args[2])) {
        form.Shown += (sender, evt) => {
          // The parent shows its standard UI if this readiness handshake fails.
          try { File.WriteAllText(args[3], "ready"); } catch { form.finished = true; form.Close(); }
        };
        Application.Run(form);
      }
      return 0;
    } catch { return 3; }
  }

  SetupUX(string operation, Process parent, string image) {
    mode = operation; installer = parent;
    // Keep a handle so ExitCode remains available after the process terminates.
    var handle = installer.Handle;
    Text = "Enturma — " + (mode == "uninstall" ? "Remover aplicativo" : mode == "update" ? "Atualizar aplicativo" : "Instalar aplicativo");
    Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
    StartPosition = FormStartPosition.CenterScreen;
    FormBorderStyle = FormBorderStyle.None;
    MaximizeBox = false; MinimizeBox = true; ControlBox = false;
    AutoScaleMode = AutoScaleMode.Dpi;
    ClientSize = new Size(520, 418);
    BackColor = Color.FromArgb(12, 28, 25); ForeColor = Color.FromArgb(237, 247, 231);
    Font = new Font("Segoe UI", 11);
    imageBytes = new MemoryStream(File.ReadAllBytes(image));
    var motion = Image.FromStream(imageBytes);
    bool animate;
    SystemParametersInfo(0x1042, 0, out animate, 0);
    art.Image = animate ? motion : new Bitmap(motion);
    if (!animate) motion.Dispose();
    art.SetBounds(0, 0, 520, 260); art.SizeMode = PictureBoxSizeMode.Zoom;
    art.AccessibleName = "Livro Enturma";
    Controls.Add(art);
    art.MouseDown += (s, e) => { if (e.Button == MouseButtons.Left) { ReleaseCapture(); SendMessage(Handle, 0xA1, 2, 0); } };
    Paint += (s, e) => { using (var pen = new Pen(Color.FromArgb(46, 81, 65))) e.Graphics.DrawRectangle(pen, 0, 0, ClientSize.Width - 1, ClientSize.Height - 1); };
    heading.SetBounds(28, 265, 464, 36);
    heading.Font = new Font("Segoe UI", 15, FontStyle.Bold);
    heading.Text = mode == "uninstall" ? "Até a próxima sessão." : mode == "update" ? "Sua próxima versão está chegando." : "Seu espaço de estudo está chegando.";
    heading.AutoEllipsis = true;
    Controls.Add(heading);
    detail.SetBounds(28, 310, 464, 46);
    detail.ForeColor = Color.FromArgb(183, 205, 193);
    detail.Text = mode == "uninstall" ? "Removendo o aplicativo deste computador…\nSua conta e seus estudos continuam preservados." : mode == "update" ? "Aplicando a atualização verificada…\nO Enturma abrirá quando estiver pronto." : "Instalando o Enturma neste computador…";
    Controls.Add(detail);
    progress.SetBounds(28, 373, 464, 6);
    progress.AccessibleRole = AccessibleRole.ProgressBar;
    progress.AccessibleName = "Operação em andamento";
    progress.BackColor = Color.FromArgb(31, 57, 45);
    double phase = 0;
    progress.Paint += (s, e) => {
      int left = animate ? (int)((Math.Sin(phase) + 1) / 2 * (progress.Width - 110)) : (progress.Width - 110) / 2;
      using (var brush = new SolidBrush(Color.FromArgb(213, 237, 122))) e.Graphics.FillRectangle(brush, left, 0, 110, progress.Height);
    };
    motionTimer.Interval = 33;
    motionTimer.Tick += (s, e) => { if (!finished && WindowState != FormWindowState.Minimized) { phase += .045; progress.Invalidate(); } };
    if (animate) motionTimer.Start();
    Controls.Add(progress);
    close.SetBounds(369, 365, 123, 34); close.Text = "Fechar"; close.Visible = false;
    close.FlatStyle = FlatStyle.Flat; close.BackColor = Color.FromArgb(213, 237, 122); close.ForeColor = Color.FromArgb(13, 43, 33);
    close.Click += (s, e) => Close(); Controls.Add(close);
    FormClosing += (s, e) => { if (!finished) e.Cancel = true; };
    poll.Interval = 160;
    poll.Tick += (s, e) => {
      if (finished) { Close(); return; }
      try {
        if (!installer.HasExited) return;
        poll.Stop(); motionTimer.Stop(); finished = true; progress.Visible = false; close.Visible = true; ControlBox = true;
        bool success = installer.ExitCode == 0;
        heading.Text = success ? (mode == "uninstall" ? "Aplicativo removido." : "Tudo pronto para estudar.") : "Não foi possível concluir.";
        detail.Text = success ? (mode == "uninstall" ? "Sua conta permanece no Enturma. Até breve!" : "Instalação concluída com sucesso.") : "O instalador foi interrompido. Execute-o novamente\npara tentar concluir a operação.";
        if (success) { poll.Interval = 1800; poll.Start(); }
      } catch { poll.Stop(); motionTimer.Stop(); finished = true; progress.Visible = false; detail.Text = "Não foi possível acompanhar o instalador. Confira o resultado no Windows."; close.Visible = true; }
    };
    poll.Start();
  }
  protected override void Dispose(bool disposing) {
    if (disposing) { poll.Dispose(); motionTimer.Dispose(); if (art.Image != null) art.Image.Dispose(); if (imageBytes != null) imageBytes.Dispose(); installer.Dispose(); }
    base.Dispose(disposing);
  }

  static int ConfirmUninstall(string image) {
    Application.EnableVisualStyles();
    using (var form = new Form()) {
      form.Text = "Desinstalar Enturma";
      form.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
      form.StartPosition = FormStartPosition.CenterScreen;
      form.FormBorderStyle = FormBorderStyle.FixedDialog;
      form.MaximizeBox = false; form.MinimizeBox = false;
      form.AutoScaleMode = AutoScaleMode.Dpi;
      form.ClientSize = new Size(520, 470);
      form.BackColor = Color.FromArgb(12, 28, 25); form.ForeColor = Color.FromArgb(237, 247, 231);
      form.Font = new Font("Segoe UI", 11);
      using (var art = new PictureBox()) {
        art.SetBounds(0, 0, 520, 240); art.SizeMode = PictureBoxSizeMode.Zoom;
        try {
          var motion = Image.FromFile(image);
          bool animate;
          SystemParametersInfo(0x1042, 0, out animate, 0);
          art.Image = animate ? motion : new Bitmap(motion);
          if (!animate) motion.Dispose();
        } catch { }
        form.Controls.Add(art);
        var title = new Label { Text = "Até a próxima sessão.", Font = new Font("Segoe UI", 17, FontStyle.Bold) };
        title.SetBounds(24, 245, 472, 40); form.Controls.Add(title);
        var choice = new CheckBox { Text = "Remover também os dados locais do Enturma", Checked = false, AutoSize = false };
        choice.SetBounds(24, 295, 472, 34); form.Controls.Add(choice);
        var detail = new Label { Text = "Inclui sessões, cache, preferências e atualizações baixadas.\nSua conta e arquivos exportados não serão apagados.", AutoSize = false };
        detail.SetBounds(24, 335, 472, 58); form.Controls.Add(detail);
        var cancel = new Button { Text = "Cancelar", DialogResult = DialogResult.Cancel };
        cancel.SetBounds(234, 410, 122, 38); form.Controls.Add(cancel);
        var remove = new Button { Text = "Desinstalar", DialogResult = DialogResult.OK };
        remove.SetBounds(366, 410, 130, 38); form.Controls.Add(remove);
        form.CancelButton = cancel;
        // Closing this dialog cancels removal; no destructive default button.
        var result = form.ShowDialog();
        if (art.Image != null) art.Image.Dispose();
        return result != DialogResult.OK ? 12 : choice.Checked ? 11 : 10;
      }
    }
  }

  static void AssertNoLinks(DirectoryInfo directory) {
    if ((directory.Attributes & FileAttributes.ReparsePoint) != 0) throw new IOException("Link de diretório não permitido.");
    foreach (var child in directory.GetFileSystemInfos()) {
      if ((child.Attributes & FileAttributes.ReparsePoint) != 0) throw new IOException("Link de arquivo não permitido.");
      var folder = child as DirectoryInfo;
      if (folder != null) AssertNoLinks(folder);
    }
  }

  static int RemoveLocalData() {
    return RemoveLocalDataAt(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData));
  }

  // The caller owns the OS app-data root; no CLI input can override it.
  static int RemoveLocalDataAt(string applicationData) {
    try {
      // Fixed application-owned directory only. No user-supplied path, Downloads
      // scanning, cloud deletion or traversal through directory junctions.
      var root = Path.GetFullPath(applicationData);
      // Electron uses package.name because productName is only in builder config.
      // Preserve this established path; changing it would lose existing sessions.
      var parent = Path.GetFullPath(Path.Combine(root, "@enturma"));
      var target = Path.GetFullPath(Path.Combine(parent, "desktop"));
      if (!String.Equals(Path.GetDirectoryName(parent), root, StringComparison.OrdinalIgnoreCase)
          || !String.Equals(Path.GetDirectoryName(target), parent, StringComparison.OrdinalIgnoreCase)) return 4;
      if (Directory.Exists(parent) && (new DirectoryInfo(parent).Attributes & FileAttributes.ReparsePoint) != 0) return 4;
      if (Directory.Exists(target)) {
        AssertNoLinks(new DirectoryInfo(target));
        Directory.Delete(target, true);
      }
      return 0;
    } catch { return 4; }
  }
}

# -*- coding: utf-8 -*-

from __future__ import division, print_function, with_statement

from sys import version_info

pyversion = "{}.{}.{}".format(version_info[0], version_info[1],
                              version_info[2])
print("Python Version:", pyversion, "\nLoading imports...", end="\r")

from os import getenv, makedirs
from os.path import isdir, join
from shutil import rmtree
from shutil import copy
from time import strftime
from urllib.request import urlretrieve

from sqlite3 import connect


if version_info[0] == 3:
    import tkinter as tk
    import tkinter.ttk as ttk
    from tkinter.filedialog import askopenfilename

elif version_info[0] == 2 and version_info[1] >= 7:
    import tkinter as tk
    import ttk
    from tkFileDialog import askopenfilename


wpad = 13  # Padding between widget and window
ipad = 3   # Padding between widgets
lpad = 5   # Larger padding between widgets


def removeWidgets(master, ignore=None):
    """ Removes all Tkinter widgets from a master window [master],
skipping widgets of type [ignore] """
    for w in master.winfo_children():
        if w.winfo_class() != ignore:
            w.destroy()


def getdate():
    """ Return the system date and time. """
    return strftime("%A %B %d, %I:%M %p")


class ask(tk.Toplevel):
    """ Ask  """
    def __init__(self, root, command, asktext,
                 oktext="OK", canceltext="Cancel", bell=True):
        self.command = command
        tk.Toplevel.__init__(self, root, bg="#FFFFFF")

        ok = ttk.Button(self, text=oktext, command=self.okcommand)
        ok.pack()
        cancel = ttk.Button(self, text=canceltext, command=self.destroy)
        cancel.pack()
        if bell:
            root.bell()

    def okcommand(self):
        self.command()
        self.destroy()


class Main(tk.Tk):
    def __init__(self, directory):
        self.directory = directory

        tk.Tk.__init__(self)
        self.wm_title("Notes")

        self.style = ttk.Style(self)
        self.style.configure("W.TLabel", background="#FFFFFF")
        self.style.configure("W.TCheckbutton", background="#FFFFFF", selected=0)

        self.menu = tk.Menu(self)
        self.menu.add_command(label="View Notes", command=self.viewnotes)
        self.menu.add_command(label="Search Notes", command=self.searchnotes)
        self.menu.add_command(label="Create Note", command=self.createnotes)

        self.config(menu=self.menu)

        if not isdir(self.directory):
            self.c, self.conn = self.install()
        else:
            self.conn = connect(join(self.directory, "Notes.db"))
            self.c = self.conn.cursor()
        self.protocol("WM_DELETE_WINDOW", self.close)

        self.iconbitmap(join(directory, "txt.ico"))

        f1 = tk.Frame(self)
        f1.pack(fill="x", expand=1)
        self.titleentry = ttk.Entry(f1, state="disabled")
        self.titleentry.pack(fill="x", expand=1, padx=(wpad, ipad),
                             pady=(wpad, ipad), side="left")
        self.dateentry = ttk.Entry(f1, width=30)
        self.dateentry.pack(padx=(ipad, wpad), pady=(wpad, ipad), side="right")
        self.dateentry.insert(0, getdate())
        self.dateentry.config(state="disabled")
        f2 = tk.Frame(self)
        f2.grid_rowconfigure(0, weight=1)
        f2.grid_columnconfigure(0, weight=1)
        yscrollbar = ttk.Scrollbar(f2)
        yscrollbar.grid(row=0, column=1, sticky="ns")
        self.body = tk.Text(f2, wrap="none", bd=0,
                            yscrollcommand=yscrollbar.set, state="disabled")
        self.body.grid(row=0, column=0, sticky="nsew")
        yscrollbar.config(command=self.body.yview)
        f2.pack(fill="both", expand=1, padx=wpad, pady=ipad)
        f3 = tk.Frame(self)
        self.leftb = ttk.Button(f3, text="<", width="0", state="disabled",
                                command=self.prevnote)
        self.leftb.pack(side="left", pady=(ipad, wpad), padx=(wpad, ipad))
        self.saveb = ttk.Button(f3, text="Save", state="disabled",
                                command=self.save)
        self.saveb.pack(pady=(ipad, wpad), padx=ipad, side="left")
        self.rightb = ttk.Button(f3, text=">", width="0", state="disabled",
                                 command=self.nextnote)
        self.rightb.pack(side="left", pady=(ipad, wpad), padx=(ipad, wpad))
        f3.pack()

    def createnotes(self):
        self.titleentry.config(state="normal")
        self.titleentry.delete(0, "end")
        self.body.config(state="normal")
        self.body.delete("1.0", "end")
        self.saveb.config(state="normal")
        self.dateentry.config(state="normal")
        self.dateentry.delete(0, "end")
        self.dateentry.insert(0, getdate())
        self.leftb.config(state="disabled")
        self.rightb.config(state="disabled")

    def viewnotes(self):
        self.titleentry.config(state="disabled")
        self.body.config(state="disabled")
        self.saveb.config(state="disabled")
        self.dateentry.config(state="disabled")
        self.leftb.config(state="disabled")
        self.rightb.config(state="disabled")

        self.notes = list()
        x = True
        count = 1
        while x:
            self.c.execute("SELECT * FROM notes WHERE id=?", (count, ))
            count += 1
            x = self.c.fetchall()
            if x:
                self.notes.append(x[0])
        self.currentnote = 0
        if self.notes:
            self.getnote(0)

    def searchnotes(self):
        self.titleentry.config(state="disabled")
        self.body.config(state="disabled")
        self.saveb.config(state="disabled")
        self.dateentry.config(state="disabled")
        self.leftb.config(state="disabled")
        self.rightb.config(state="disabled")

        self.s = tk.Toplevel(self, background="#FFFFFF")
        self.s.title("Notes - Search")
        self.s.resizable(True, False)
        s = tk.Frame(self.s, bg="#FFFFFF")
        s.pack()

        l = ttk.Label(s, text="Search for:", style="W.TLabel")
        l.pack(side="left", padx=(wpad, ipad), pady=(wpad, lpad))
        e = ttk.Entry(s, width=30)
        e.pack(side="right", padx=(ipad, wpad), pady=(wpad, lpad),
               fill="x", expand=True)
        self.s.bind("<Return>", lambda x, e=e: self.search(e.get()))
        self.bodysearch = tk.IntVar(self, 0)
        r = ttk.Checkbutton(self.s, style="W.TCheckbutton",
                            text="Search in body text",
                            onvalue=1, offvalue=0, var=self.bodysearch)
        r.pack(pady=(lpad, wpad), padx=wpad)

    def search(self, title):
        if not title:
            return
        self.notes = list()

        self.c.execute("SELECT * FROM notes WHERE title LIKE ?",
                       ("%"+title+"%",))
        self.notes = self.c.fetchall()
        if self.bodysearch.get():
            self.c.execute("SELECT * FROM notes WHERE body LIKE ?",
                           ("%"+title+"%",))
        self.notes += self.c.fetchall()

        self.currentnote = 0
        if self.notes:
            self.getnote(0)
            self.s.destroy()
        else:
            self.bell()

    def nextnote(self):
        self.getnote(self.currentnote + 1)

    def prevnote(self):
        self.getnote(self.currentnote - 1)

    def getnote(self, id, search=False):
        self.dateentry.config(state="normal")
        self.dateentry.delete(0, "end")
        self.dateentry.insert(0, self.notes[id][1])
        self.dateentry.config(state="disabled")

        self.titleentry.config(state="normal")
        self.titleentry.delete(0, "end")
        self.titleentry.insert(0, self.notes[id][2])
        self.titleentry.config(state="disabled")

        self.body.config(state="normal")
        self.body.delete("1.0", "end")
        self.body.insert("end", self.notes[id][3])
        self.body.config(state="disabled")

        self.currentnote = id

        if id > len(self.notes) - 2:
            self.rightb.config(state="disabled")
        else:
            self.rightb.config(state="normal")

        if id == 0:
            self.leftb.config(state="disabled")
        else:
            self.leftb.config(state="normal")

    def uninstall(self):
        self.close()
        rmtree(self.directory)

    def install(self):
        makedirs(join(self.directory))
        copy(__file__, join(self.directory, "Notes.py"))
        conn = connect(join(self.directory, "Notes.db"))
        c = conn.cursor()
        c.execute("CREATE TABLE notes(id integer primary key, \
        date text, title text, body text)")
        conn.commit()
        url = "https://sites.google.com/site/finnventor/python/internal-files/\
txt.ico?attredirects=0&d=1"
        self.download(url, join(self.directory, "txt.ico"))
        return c, conn

    def download(self, url, directory):
        """ Download a file from [url] and place it in [directory] """
        while True:
                try:
                    urlretrieve(url, directory)  # this fails if no internet
                    break
                except IOError:
                    if not ask("Notes", "Error: No internet connection", self):
                        raise

    def save(self):
        self.note(self.titleentry.get(), self.body.get("1.0", "end"),
                  self.dateentry.get())
        self.titleentry.delete(0, "end")
        self.body.delete("1.0", "end")
        self.dateentry.delete(0, "end")
        self.dateentry.insert(0, getdate())

    def select(self):
        tempnotefile = askopenfilename(title="Select Note File",
                                       filetypes=(("All files", "*.*"),
                                                  ("Text files", "*.txt")))
        if tempnotefile:
            self.notefile = tempnotefile
            self.buttonstate("normal")

    def note(self, name, text, date):
        self.c.execute("INSERT INTO notes values (NULL, ?, ?, ?)",
                       (date, name, text))
        self.conn.commit()

    def test(self):
        """ Create a test note """
        self.note("Test Note", """ This is a note.
second line""", "date")

    def close(self):
        """ Close the SQLite connection and destroy the window """
        self.conn.close()
        self.destroy()


if __name__ == "__main__":
    directory = join(getenv("APPDATA"), "Notes")

    x = Main(directory)
#    x.test()
    print("Window loaded.           ", end="\r")
    x.mainloop()

import { app, Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron'

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string
    submenu?: DarwinMenuItemConstructorOptions[] | Menu
}

export default class MenuBuilder {
    mainWindow: BrowserWindow

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow
    }

    buildMenu(): Menu {

        this.mainWindow.webContents.on('context-menu', (_, props) => {
            const items: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
                { role: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C' },
                { role: 'cut', label: 'Cut', accelerator: 'CmdOrCtrl+X' },
                { role: 'paste', label: 'Paste', accelerator: 'CmdOrCtrl+V' },
            ]
            // Add each spelling suggestion
            for (const suggestion of props.dictionarySuggestions.slice(0, 3)) {
                items.push({
                    label: `${'ReplaceWith'} "${suggestion}"`,
                    click: () => this.mainWindow.webContents.replaceMisspelling(suggestion),
                })
            }
            if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
                items.push({
                    label: 'Inspect element',
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y)
                    },
                })
            }
            const { x, y } = props
            Menu.buildFromTemplate(items).popup({ window: this.mainWindow })
        })

        const template = process.platform === 'darwin' ? this.buildDarwinTemplate() : this.buildDefaultTemplate()

        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)

        return menu
    }

    buildDarwinTemplate(): MenuItemConstructorOptions[] {
        const subMenuAbout: DarwinMenuItemConstructorOptions = {
            label: 'Chatbot Desktop',
            submenu: [
                {
                    label: 'About Chatbot Desktop',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                { type: 'separator' },
                { label: 'Services', submenu: [] },
                { type: 'separator' },
                {
                    label: 'Hide Chatbot Desktop',
                    accelerator: 'Command+H',
                    selector: 'hide:',
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:',
                },
                { label: 'Show All', selector: 'unhideAllApplications:' },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit()
                    },
                },
            ],
        }
        const subMenuEdit: DarwinMenuItemConstructorOptions = {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
                {
                    label: 'Redo',
                    accelerator: 'Shift+Command+Z',
                    selector: 'redo:',
                },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
                { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
                {
                    label: 'Paste',
                    accelerator: 'Command+V',
                    selector: 'paste:',
                },
                {
                    label: 'Select All',
                    accelerator: 'Command+A',
                    selector: 'selectAll:',
                },
            ],
        }
        const subMenuViewDev: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload()
                    },
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                    },
                },
            ],
        }
        const subMenuViewProd: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                    },
                },
            ],
        }
        const subMenuWindow: DarwinMenuItemConstructorOptions = {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'Command+M',
                    selector: 'performMiniaturize:',
                },
                {
                    label: 'Close',
                    accelerator: 'Command+W',
                    selector: 'performClose:',
                },
                { type: 'separator' },
                { label: 'Bring All to Front', selector: 'arrangeInFront:' },
            ],
        }
        const subMenuHelp: MenuItemConstructorOptions = {
            label: 'Help',
            submenu: [
            ],
        }

        const subMenuView =
            process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
                ? subMenuViewDev
                : subMenuViewProd

        return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp]
    }

    buildDefaultTemplate() {
        const templateDefault = [
            {
                label: '&File',
                submenu: [
                    {
                        label: '&Open',
                        accelerator: 'Ctrl+O',
                    },
                    {
                        label: '&Close',
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close()
                        },
                    },
                ],
            },
            {
                label: '&View',
                submenu:
                    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
                        ? [
                              {
                                  label: '&Reload',
                                  accelerator: 'Ctrl+R',
                                  click: () => {
                                      this.mainWindow.webContents.reload()
                                  },
                              },
                              {
                                  label: 'Toggle &Full Screen',
                                  accelerator: 'F11',
                                  click: () => {
                                      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                                  },
                              },
                          ]
                        : [
                              {
                                  label: 'Toggle &Full Screen',
                                  accelerator: 'F11',
                                  click: () => {
                                      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                                  },
                              },
                          ],
            },
            {
                label: 'Help',
                submenu: [
                ],
            },
        ]

        return templateDefault
    }
}

import {m} from 'malevic';
import {mergeClass} from '../utils';
import {isFirefox} from '../../../utils/platform';
import {Shortcuts} from '../../../definitions';

interface ShortcutLinkProps {
    class?: string | {[cls: string]: any};
    commandName: string;
    shortcuts: Shortcuts;
    textTemplate: (shortcut: string) => string;
    onSetShortcut: (shortvut: string) => void;
}

/**
 * Displays a shortcut and navigates
 * to Chrome Commands page on click.
 */
export default function ShortcutLink(props: ShortcutLinkProps) {
    const cls = mergeClass('shortcut', props.class);
    const shortcut = props.shortcuts[props.commandName];
    const shortcutClass = document.getElementsByClassName("shortcut");
    const toggleCurrent = document.getElementsByClassName("shortcut").item(0);
    const toggleExtension = document.getElementsByClassName("shortcut").item(1);

    if (shortcutClass.length == 3) {
        if (toggleCurrent.innerHTML.lastIndexOf("Toggle") > 5) {
            toggleCurrent.innerHTML = toggleCurrent.innerHTML.slice(0,toggleCurrent.innerHTML.indexOf("Toggle",1));
        }
        if (toggleExtension.innerHTML.lastIndexOf("Toggle") > 5) {
            toggleExtension.innerHTML = toggleExtension.innerHTML.slice(0,toggleExtension.innerHTML.indexOf("Toggle",1));
        }
    }

    let enteringShortcutInProgress = false;

    function startEnteringShortcut(node: HTMLAnchorElement) {
        if (enteringShortcutInProgress) {
            return;
        }
        enteringShortcutInProgress = true;

        const initialText = node.textContent;
        node.textContent = '...⌨';

        function onKeyDown(e: KeyboardEvent) {
            e.preventDefault();
            const ctrl = e.ctrlKey;
            const alt = e.altKey;
            const command = e.metaKey;
            const shift = e.shiftKey;

            let key: string = null;
            if (e.code.startsWith('Key')) {
                key = e.code.substring(3);
            } else if (e.code.startsWith('Digit')) {
                key = e.code.substring(5);
            }

            const shortcut = `${ctrl ? 'Ctrl+' : alt ? 'Alt+' : command ? 'Command+' : ''}${shift ? 'Shift+' : ''}${key ? key : ''}`;
            node.textContent = shortcut;

            if ((ctrl || alt || command || shift) && key) {
                removeListeners();
                props.onSetShortcut(shortcut);
                node.blur();
                setTimeout(() => {
                    enteringShortcutInProgress = false;
                    node.classList.remove('shortcut--edit');
                    node.textContent = props.textTemplate(shortcut);
                }, 500);
            }
        }

        function onBlur() {
            removeListeners();
            node.classList.remove('shortcut--edit');
            node.textContent = initialText;
            enteringShortcutInProgress = false;
        }

        function removeListeners() {
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('blur', onBlur, true);
        }

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('blur', onBlur, true);
        node.classList.add('shortcut--edit');
    }

    function onClick(e: Event) {
        e.preventDefault();
        if (isFirefox()) {
            startEnteringShortcut(e.target as HTMLAnchorElement);
            return;
        }
        chrome.tabs.create({
            url: `chrome://extensions/configureCommands#command-${chrome.runtime.id}-${props.commandName}`,
            active: true
        });
    }

    return (
        <a
            class={cls}
            href="#"
            onclick={onClick}
        >{props.textTemplate(shortcut)}</a>
    );
}

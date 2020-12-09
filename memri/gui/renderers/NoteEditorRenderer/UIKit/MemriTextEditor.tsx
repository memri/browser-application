import * as React from "react";
import {font, frame, MainUI, MemriTextField, padding, VStack} from "../../../swiftUI";
import { Editable, withReact, useSlate, Slate } from 'slate-react'
import { Editor, Transforms, createEditor, Node,Text } from 'slate'
import { withHistory } from 'slate-history'
import {useCallback, useMemo, useState} from "react";
import {Button, Icon, Toolbar} from "@material-ui/core";
import {jsx} from "slate-hyperscript";
import {geom} from "../../../../../geom";

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const ELEMENT_TAGS = {
    A: el => ({ type: 'link', url: el.getAttribute('href') }),
    BLOCKQUOTE: () => ({ type: 'quote' }),
    H1: () => ({ type: 'heading-one' }),
    H2: () => ({ type: 'heading-two' }),
    H3: () => ({ type: 'heading-three' }),
    H4: () => ({ type: 'heading-four' }),
    H5: () => ({ type: 'heading-five' }),
    H6: () => ({ type: 'heading-six' }),
    IMG: el => ({ type: 'image', url: el.getAttribute('src') }),
    LI: () => ({ type: 'list-item' }),
    OL: () => ({ type: 'numbered-list' }),
    P: () => ({ type: 'paragraph' }),
    PRE: () => ({ type: 'code' }),
    UL: () => ({ type: 'bulleted-list' }),
}

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
const TEXT_TAGS = {
    CODE: () => ({ code: true }),
    DEL: () => ({ strikethrough: true }),
    EM: () => ({ italic: true }),
    I: () => ({ italic: true }),
    S: () => ({ strikethrough: true }),
    STRONG: () => ({ bold: true }),
    U: () => ({ underline: true }),
}

// Define a serializing function that takes a value and returns a string.
const serialize = value => {
    return (
        value
            // Return the string content of each paragraph in the value's children.
            .map(transform)
            // Join them all with line breaks denoting paragraphs.
            .join('<br/>')
    )

    function transform(node) {

        if (Text.isText(node)) {
            let text = node.text;
            if (node.bold) {
                text = `<strong>${text}</strong>`
            }

            if (node.code) {
                text = `<code>${text}</code>`
            }

            if (node.italic) {
                text = `<em>${text}</em>`
            }

            if (node.underline) {
                text = `<u>${text}</u>`
            }

            if (node.strikethrough) {
                text = `<del>${text}</del>`
            }
            return text;
        }

        const children = node.children.map(n => transform(n)).join('')

        switch (node.type) {
            /*case 'quote':
                return `<blockquote><p>${children}</p></blockquote>`
            case 'paragraph':
                return `<p>${children}</p>`*/
            case 'bulleted-list':
                return `<ul>${children}</ul>`
            case 'numbered-list':
                return `<ol>${children}</ol>`
            case 'list-item':
                return `<li>${children}</li>`
            case 'heading-one':
                return `<h1>${children}</h1>`
            case 'heading-two':
                return `<h2>${children}</h2>`
            default:
                return children
        }
    }
}

// Define a deserializing function that takes a string and returns a value.
const deserialize = string => {

    return string.split(/<br\s*\/>/i).map(line => {
        const document = new DOMParser().parseFromString(line, 'text/html')
        let test = deserializer(document.body);
        return {
            children: test,
        }
    })

    function deserializer(el) {
        if (el.nodeType === 3) {
            return el.textContent
        } else if (el.nodeType !== 1) {
            return null
        } else if (el.nodeName === 'BR') {
            return '\n'
        }
        if (el?.textContent == "") {
            return [{ text: '' }]
        }

        const { nodeName } = el
        let parent = el

        if (
            nodeName === 'PRE' &&
            el.childNodes[0] &&
            el.childNodes[0].nodeName === 'CODE'
        ) {
            parent = el.childNodes[0]
        }
        const children = Array.from(parent.childNodes)
            .map(deserializer)
            .flat()

        if (el.nodeName === 'BODY') {
            return jsx('fragment', {}, children)
        }

        if (ELEMENT_TAGS[nodeName]) {
            const attrs = ELEMENT_TAGS[nodeName](el)
            return jsx('element', attrs, children)
        }

        if (TEXT_TAGS[nodeName]) {
            const attrs = TEXT_TAGS[nodeName](el)
            return children.map(child => jsx('text', attrs, child))
        }

        return children
    }
}

function updateHeight() {
    let topNavigation = document.getElementsByClassName("TopNavigation").item(0)
    let bottomBarView = document.getElementsByClassName("BottomBarView").item(0);
    //TODO: temporary decision @mkslanc
    return geom.size.height - topNavigation.clientHeight - bottomBarView.clientHeight - 84
}

export const MemriTextEditor = (props) => {
    let content = props.model?.body ?? "";
    const [value, setValue] = useState<Node[]>(deserialize(content))
    const renderElement = useCallback(props => <Element {...props} />, [])
    const renderLeaf = useCallback(props => <Leaf {...props} />, [])
    const editor = useMemo(() => withHistory(withReact(createEditor())), [])

    return (

            <VStack spacing={0} width={geom.size.width - 20} padding={padding(10)}>
                <Slate editor={editor} value={value} onChange={(value) => {
                    setValue(value);
                    props.onModelUpdate({title: props.model?.title, body: serialize(value)})
                }}>
                    <div className={"MemriTextEditor"} style={{overflowY: "auto", height: updateHeight()}}>
                        <MemriTextField value={props.model?.title ?? ""} font={font({size: 30})} frame={frame({height: 31})}
                                        placeholder={props.titleHint ?? ""} onChange={(e) => {
                            props.onModelUpdate({title: e.target.value, body: props.model?.body})
                        }}>

                        </MemriTextField>
                        <Editable
                            renderElement={renderElement}
                            renderLeaf={renderLeaf}
                            placeholder="Enter some rich text…"
                            spellCheck
                            autoFocus
                        />
                    </div>
                    <Toolbar disableGutters={true}>
                        <MarkButton format="bold" icon="format_bold"/>
                        <MarkButton format="italic" icon="format_italic"/>
                        <MarkButton format="underline" icon="format_underlined"/>
                        <MarkButton format="strikethrough" icon="format_strikethrough"/>
                        <BlockButton format="bulleted-list" icon="format_list_bulleted"/>
                        <BlockButton format="numbered-list" icon="format_list_numbered"/>
                        <BlockButton format="heading-one" icon="looks_one"/>
                        <BlockButton format="heading-two" icon="looks_two"/>

                    </Toolbar>
                </Slate>
            </VStack>
    )
}



const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type as string),
        split: true,
    })

    Transforms.setNodes(editor, {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    })

    if (!isActive && isList) {
        const block = { type: format, children: [] }
        Transforms.wrapNodes(editor, block)
    }
}

const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format)

    if (isActive) {
        Editor.removeMark(editor, format)
    } else {
        Editor.addMark(editor, format, true)
    }
}

const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
        match: n => n.type === format,
    })

    return !!match
}

const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
}

const Element = ({ attributes, children, element }) => {
    switch (element.type) {
        case 'block-quote':
            return <blockquote {...attributes}>{children}</blockquote>
        case 'bulleted-list':
            return <ul {...attributes}>{children}</ul>
        case 'heading-one':
            return <h1 {...attributes}>{children}</h1>
        case 'heading-two':
            return <h2 {...attributes}>{children}</h2>
        case 'list-item':
            return <li {...attributes}>{children}</li>
        case 'numbered-list':
            return <ol {...attributes}>{children}</ol>
        default:
            return <p {...attributes}>{children}</p>
    }
}

const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }

    if (leaf.code) {
        children = <code>{children}</code>
    }

    if (leaf.italic) {
        children = <em>{children}</em>
    }

    if (leaf.underline) {
        children = <u>{children}</u>
    }

    if (leaf.strikethrough) {
        children = <del>{children}</del>
    }

    return <span {...attributes}>{children}</span>
}

const BlockButton = ({ format, icon }) => {
    const editor = useSlate()
    return (
        <Button style={{minWidth:20}} size={"small"}
            active={isBlockActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault()
                toggleBlock(editor, format)
            }}
        >
            <Icon>{icon}</Icon>
        </Button>
    )
}

const MarkButton = ({ format, icon }) => {
    const editor = useSlate()
    return (
        <Button style={{minWidth:20}} size={"small"}
            active={isMarkActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault()
                toggleMark(editor, format)
            }}
        >
            <Icon fontSize="small">{icon}</Icon>
        </Button>
    )
}
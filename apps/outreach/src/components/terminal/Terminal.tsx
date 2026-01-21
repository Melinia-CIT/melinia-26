import classNames from "classnames"
import React, { UIEvent, useEffect, useRef, useState } from "react"
import "./Terminal.css"

export type TerminalFontSize = "xtiny" | "tiny" | "small" | "medium" | "large"

export interface TerminalProps {
    className?: string
    columns: number
    rows: number
    fontSize?: TerminalFontSize
    title?: string
    lines?: string[]
    whitespacePadding?: number
    disableScrolling?: boolean
    hideWindowChrome?: boolean
}

export default function Terminal({
    columns,
    rows,
    fontSize = "medium",
    className,
    title,
    lines,
    whitespacePadding = 0,
    disableScrolling = false,
    hideWindowChrome = false,
}: TerminalProps) {
    const [platformStyle, setPlatformStyle] = useState("macos")
    useEffect(() => {
        const userAgent = window?.navigator.userAgent
        const isLinux = /Linux/i.test(userAgent)
        setPlatformStyle(isLinux ? "adwaita" : "macos")
    }, [])

    const [autoScroll, setAutoScroll] = useState(true)
    const handleScroll = (e: UIEvent<HTMLElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLElement
        const position = Math.ceil((scrollTop / (scrollHeight - clientHeight)) * 100)
        if (position < 100) {
            setAutoScroll(false)
        }
        if (position == 100) {
            setAutoScroll(true)
        }
    }

    const codeRef = useRef<HTMLPreElement>(null)
    useEffect(() => {
        if (autoScroll) {
            codeRef.current?.scrollTo({
                top: codeRef.current.scrollHeight,
                behavior: "instant",
            })
        }
    }, [lines?.length, autoScroll])

    const padding = " ".repeat(whitespacePadding)
    return (
        <div
            className={classNames(
                "terminal",
                className,
                {
                    "font-xtiny": fontSize === "xtiny",
                    "font-tiny": fontSize === "tiny",
                    "font-small": fontSize === "small",
                    "font-medium": fontSize === "medium",
                    "font-large": fontSize === "large",
                },
                {
                    adwaita: platformStyle === "adwaita",
                    macos: platformStyle === "macos",
                },
                {
                    "hide-window-chrome": hideWindowChrome,
                }
            )}
            style={
                {
                    "--columns": columns + 2 * whitespacePadding,
                    "--rows": rows,
                } as React.CSSProperties
            }
        >
            {!hideWindowChrome && (
                <div className="header">
                    {platformStyle === "adwaita" && <AdwaitaButtons />}
                    {platformStyle === "macos" && <MacosButtons />}
                    <span className="title">{title}</span>
                </div>
            )}
            <pre
                ref={codeRef}
                className={classNames("content", {
                    "disable-scrolling": disableScrolling,
                })}
                onScroll={handleScroll}
            >
                {lines?.map((line, i) => {
                    return (
                        <div
                            key={i + line}
                            dangerouslySetInnerHTML={{
                                __html: `${padding}${line}${padding}`,
                            }}
                        />
                    )
                })}
            </pre>
        </div>
    )
}

function AdwaitaButtons() {
    return (
        <>
            <ul className={classNames("window-controls", "start")}>
                <li></li>
            </ul>
            <ul className={classNames("window-controls", "end")}>
                <li></li>
                <li></li>
                <li className="circular-button"></li>
            </ul>
        </>
    )
}

function MacosButtons() {
    return (
        <ul className={classNames("window-controls", "start")}>
            <li className="circular-button"></li>
            <li className="circular-button"></li>
            <li className="circular-button"></li>
        </ul>
    )
}

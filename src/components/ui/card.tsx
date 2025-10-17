import React from 'react';
type DivProps = React.HTMLAttributes<HTMLDivElement>;
export function Card(props: React.PropsWithChildren<DivProps>) {
	return <div {...props}>{props.children}</div>;
}
export function CardContent(props: React.PropsWithChildren<DivProps>) {
	return <div {...props}>{props.children}</div>;
}
export function CardDescription(props: React.PropsWithChildren<DivProps>) {
	return <div {...props}>{props.children}</div>;
}
export function CardHeader(props: React.PropsWithChildren<DivProps>) {
	return <div {...props}>{props.children}</div>;
}
export function CardTitle(props: React.PropsWithChildren<DivProps>) {
	return <div {...props}>{props.children}</div>;
}

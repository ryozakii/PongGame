import style from '@styles/side_bar_entry.module.css'
import { link } from 'fs';
import Link from 'next/link'
function side_bar_entry(props: { icon: any; title: string; link: string; }) {
  return (
	<Link href={props.link}>
		<div className={style.hero}>
			<div>
				{props.icon}
			</div>
			<h1>
				{props.title}
			</h1>
		</div>
	</Link>
  )
}

export default side_bar_entry
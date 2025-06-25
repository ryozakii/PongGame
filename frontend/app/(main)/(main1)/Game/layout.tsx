import style from '@styles/pingpong.module.css';

export default function LocalGameLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return <div className={style.main}>{children}</div>;
  }
  
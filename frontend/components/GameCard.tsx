import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import style from "@styles/games.module.css";

interface GameCardProps {
  title: string;
  description: string;
  link: string;
  backgroundClass: string;
  buttonText: string;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  link,
  backgroundClass,
  buttonText,
}) => (
  <Card className={`${backgroundClass} ${style.card}`}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription className={style.description}>{description}</CardDescription>
    </CardHeader>
    <CardFooter className={style.footer}>
      {link ? (
        <Link href={link}>
          <Button>{buttonText}</Button>
        </Link>
      ) : (
        <Button>{buttonText}</Button>
      )}
    </CardFooter>
  </Card>
);

export default GameCard;

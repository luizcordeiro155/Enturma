import Link from "next/link";
import { BookOpen, RefreshCw } from "lucide-react";
import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <BookOpen size={48} />
        <span className={styles.brand}>
          enturma<span>.</span>
        </span>
        <h1>Você está sem conexão.</h1>
        <p>
          O Enturma precisa da internet para sincronizar salas, mensagens e seus
          dados. Assim que a conexão voltar, tente abrir novamente.
        </p>
        <Link href="/home" className={styles.button}>
          <RefreshCw size={18} />
          Tentar novamente
        </Link>
      </section>
    </main>
  );
}

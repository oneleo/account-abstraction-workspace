// HTML Styles CSS
import styles from "./page.module.css"

// AA
import { AA } from "@/components/AA"
export default function Home() {
    return (
        <main className={styles.main}>
            <div className={styles.description}></div>

            <div className={styles.grid}>
                <a>
                    <AA />
                </a>
            </div>
        </main>
    )
}

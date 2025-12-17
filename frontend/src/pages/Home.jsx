import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

const Home = () => {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (!destination.trim()) {
      alert('目的地を入力してください。')
      return
    }
    navigate(`/spot.html?q=${encodeURIComponent(destination)}&days=${encodeURIComponent(days)}`)
  }

  return (
    <>
      {/* ヒーローセクション */}
      <header className="hero">
        <div className="hero-content">
          <h1>世界を新しい方法で発見しよう</h1>
          <p>スマート検索 · お得なプラン · 本物のレビュー</p>
          <form className="search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="行きたい場所を入力（例：東京 / 京都 / 沖縄）"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <select
              title="旅行日数を選択"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            >
              <option value="">日数を選択</option>
              <option value="3日間">3日間</option>
              <option value="5日間">5日間</option>
              <option value="7日間">7日間</option>
              <option value="10日以上">10日以上</option>
            </select>
            <button type="submit" className="btn">検索する</button>
          </form>
        </div>
      </header>

      {/* 人気の旅先 */}
      <section id="destinations">
        <h2>人気の旅先</h2>
        <p className="lead">世界中の旅行者が注目する目的地</p>
        <div className="grid grid-4">
          <div className="card">
            <img src="https://images.unsplash.com/photo-1549693578-d683be217e58?q=80&w=1200" alt="東京" />
            <div className="card-body">
              <div className="card-title">日本 · 東京</div>
              <div className="muted">伝統とモダンが交差する都市</div>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1508051123996-69f8caf4891e?q=80&w=1200" alt="パリ" />
            <div className="card-body">
              <div className="card-title">フランス · パリ</div>
              <div className="muted">芸術と浪漫の街</div>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200" alt="モルディブ" />
            <div className="card-body">
              <div className="card-title">モルディブ</div>
              <div className="muted">青い海と静かな島の楽園</div>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1200" alt="ドバイ" />
            <div className="card-body">
              <div className="card-title">UAE · ドバイ</div>
              <div className="muted">未来都市と砂漠のコントラスト</div>
            </div>
          </div>
        </div>
      </section>

      {/* おすすめプラン */}
      <section id="packages">
        <h2>おすすめプラン</h2>
        <p className="lead">コスパ最高・透明価格・安心サポート</p>
        <div className="grid grid-4">
          <div className="card">
            <img src="https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1200" alt="東京" />
            <div className="card-body">
              <div className="card-title">東京5日間フリープラン</div>
              <div className="muted">4つ星ホテル＋空港送迎付き</div>
              <p style={{ fontWeight: 700 }}>¥49,000</p>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1495433324511-bf8e92934d90?q=80&w=1200" alt="パリ" />
            <div className="card-body">
              <div className="card-title">パリ7日間ロマンチックツアー</div>
              <div className="muted">ルーブル・ヴェルサイユ・セーヌ川</div>
              <p style={{ fontWeight: 700 }}>¥89,000</p>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200" alt="モルディブ" />
            <div className="card-body">
              <div className="card-title">モルディブ6日間ハネムーン</div>
              <div className="muted">水上ヴィラ＋プライベートボート</div>
              <p style={{ fontWeight: 700 }}>¥129,000</p>
            </div>
          </div>
          <div className="card">
            <img src="https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1200" alt="ドバイ" />
            <div className="card-body">
              <div className="card-title">ドバイ5日間プレミアム旅</div>
              <div className="muted">砂漠サファリ＋ブルジュハリファ</div>
              <p style={{ fontWeight: 700 }}>¥79,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* レビュー */}
      <section id="reviews">
        <h2>旅行者の声</h2>
        <p className="lead">リアルな体験談で安心の旅を</p>
        <div className="review">
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200" alt="avatar" />
          <div>
            <strong>Li Hua · 東京フリープラン</strong>
            <div className="muted">「対応が丁寧でスケジュールも完璧。大満足です！」</div>
          </div>
        </div>
        <div className="review">
          <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200" alt="avatar" />
          <div>
            <strong>Alice · パリカップルツアー</strong>
            <div className="muted">「ホテルの立地が最高、ガイドもとても親切でした。」</div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

export default Home

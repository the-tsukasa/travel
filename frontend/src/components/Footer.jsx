import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer id="contact">
      <div className="footer-container">
        {/* ブランドセクション */}
        <div className="footer-section">
          <div className="footer-brand">
            <span className="brand-dot"></span>
            <span>TravelGo</span>
          </div>
          <p className="footer-description">
            世界を新しい方法で発見するためのスマート旅行プラットフォーム。人気の旅行先・お得なプラン・本物のレビューを集約しています。
          </p>
          <div className="social-links">
            <a href="#" className="social-link" title="Twitter">📱</a>
            <a href="#" className="social-link" title="Facebook">📘</a>
            <a href="#" className="social-link" title="Instagram">📷</a>
            <a href="#" className="social-link" title="YouTube">📺</a>
          </div>
        </div>

        {/* クイックリンク */}
        <div className="footer-section">
          <h3>クイックリンク</h3>
          <ul className="footer-links">
            <li><Link to="/">ホーム</Link></li>
            <li><Link to="/spot.html">観光スポット</Link></li>
            <li><Link to="/notes">旅行ノート</Link></li>
            <li><Link to="/register">会員登録</Link></li>
            <li><Link to="/login">ログイン</Link></li>
          </ul>
        </div>

        {/* サービス */}
        <div className="footer-section">
          <h3>サービス</h3>
          <ul className="footer-links">
            <li><a href="#destinations">人気の旅先</a></li>
            <li><a href="#packages">おすすめプラン</a></li>
            <li><a href="#reviews">旅行者の声</a></li>
            <li><a href="#">プライバシーポリシー</a></li>
            <li><a href="#">利用規約</a></li>
          </ul>
        </div>

        {/* お問い合わせ */}
        <div className="footer-section">
          <h3>お問い合わせ</h3>
          <div className="footer-contact">
            <span>📧</span>
            <a href="mailto:hello@travelgo.com">hello@travelgo.com</a>
          </div>
          <div className="footer-contact">
            <span>📞</span>
            <span>0120-XXX-XXX</span>
          </div>
          <div className="footer-contact">
            <span>📍</span>
            <span>東京都渋谷区...</span>
          </div>
        </div>
      </div>

      {/* フッター下部 */}
      <div className="footer-bottom">
        <p>© 2025 TravelGo. All rights reserved.</p>
        <p>当サイトは旅行情報を提供するプラットフォームです。実際の予約は各サービス提供者に直接お問い合わせください。</p>
      </div>
    </footer>
  )
}

export default Footer

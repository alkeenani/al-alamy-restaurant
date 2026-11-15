import { ArrowDownIcon } from '../common/Icons.jsx'
import './Hero.css'

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="hero__eyebrow">الشيف السعيد العجمي</p>
        <h1 className="hero__title" id="hero-title">
          العالمي
        </h1>
        <p className="hero__welcome">
          أهلاً وسهلاً بكم في مطعم العالمي. تصفحوا قائمتنا من المأكولات.
        </p>
        <div className="hero__event">
          <p className="hero__event-text">
            نحن على أتم الاستعداد لتجهيز جميع الحفلات والمناسبات
          </p>
        </div>
        <a className="hero__cta" href="#menu">
          <span>تصفح المنيو</span>
          <ArrowDownIcon />
        </a>
      </div>
    </section>
  )
}

export default Hero

import { developerInfo, restaurantInfo } from '../../data/siteInfo.js'
import { buildWhatsAppUrl } from '../../lib/whatsapp.js'
import {
  FacebookIcon,
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LocationIcon,
  TikTokIcon,
  WhatsAppIcon,
} from '../common/Icons.jsx'
import './Footer.css'

function Footer() {
  const restaurantWhatsAppUrl = buildWhatsAppUrl(
    restaurantInfo.whatsappInternational,
  )
  const developerWhatsAppUrl = buildWhatsAppUrl(
    developerInfo.whatsappInternational,
  )

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <section
          className="site-footer__restaurant"
          aria-label="معلومات المطعم"
        >
          <div className="site-footer__identity">
            <p className="site-footer__name">{restaurantInfo.name}</p>
            <p className="site-footer__latin">{restaurantInfo.latinName}</p>
            <p className="site-footer__owner">
              الشيف: {restaurantInfo.owner}
            </p>
          </div>

          <div className="site-footer__block">
            <h2 className="site-footer__heading">بيانات المطعم</h2>
            <ul className="site-footer__list">
              <li className="site-footer__item">
                <LocationIcon size={16} />
                <span>{restaurantInfo.location}</span>
              </li>
              <li className="site-footer__item">
                <WhatsAppIcon size={16} />
                <a
                  href={restaurantWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span dir="ltr">{restaurantInfo.whatsappLocal}</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="site-footer__block">
            <h2 className="site-footer__heading">تابع المطعم</h2>
            <div className="site-footer__icon-links">
              <a
                className="site-footer__icon-link"
                href={restaurantWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب مطعم العالمي"
              >
                <WhatsAppIcon size={18} />
              </a>
              <a
                className="site-footer__icon-link"
                href={restaurantInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فيسبوك مطعم العالمي"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                className="site-footer__icon-link"
                href={restaurantInfo.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تيك توك مطعم العالمي"
              >
                <TikTokIcon size={18} />
              </a>
              <a
                className="site-footer__icon-link"
                href={restaurantInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="إنستغرام مطعم العالمي"
              >
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>
        </section>

        <section
          className="site-footer__developer"
          aria-labelledby="developer-title"
        >
          <div className="site-footer__developer-heading">
            <h2 className="visually-hidden" id="developer-title">
              معلومات المطور
            </h2>
            <p className="site-footer__credit" lang="en" dir="ltr">
              {developerInfo.credit}
            </p>
            <p className="site-footer__developer-phone">
              واتساب المطور:{' '}
              <a
                href={developerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span dir="ltr">{developerInfo.whatsappLocal}</span>
              </a>
            </p>
          </div>
          <ul
            className="site-footer__developer-links"
            aria-label="روابط المطور"
          >
            <li>
              <a
                className="site-footer__icon-link"
                href={developerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب المطور"
              >
                <WhatsAppIcon size={18} />
              </a>
            </li>
            <li>
              <a
                className="site-footer__icon-link"
                href={developerInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فيسبوك المطور"
              >
                <FacebookIcon size={18} />
              </a>
            </li>
            <li>
              <a
                className="site-footer__icon-link"
                href={developerInfo.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub المطور"
              >
                <GitHubIcon size={18} />
              </a>
            </li>
            <li>
              <a
                className="site-footer__icon-link"
                href={developerInfo.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="معرض أعمال المطور"
              >
                <GlobeIcon size={18} />
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="container site-footer__bottom">
        <p>© جميع الحقوق محفوظة لمطعم العالمي</p>
      </div>
    </footer>
  )
}

export default Footer

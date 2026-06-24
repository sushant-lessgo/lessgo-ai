// Server-safe published variant of the Surge footer. No hooks, flat props.

import React from 'react';
import { FOOTER_STYLES } from './styles';

interface SocialLink {
  id?: string;
  platform?: string;
  href?: string;
}

interface ContactFooterRichPublishedProps {
  sectionId: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  copyright?: string;
  social_links?: SocialLink[];
  content?: any;
}

export default function ContactFooterRichPublished(props: ContactFooterRichPublishedProps) {
  const socialLinks = Array.isArray(props.social_links) ? props.social_links : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="sg-footer">
        <div className="sg-footer__top">
          <div className="sg-footer__brand">
            <div className="sg-footer__brand-row">
              <span className="sg-footer__mark" />
              <span>Studio</span>
            </div>
            {props.tagline && <p className="sg-footer__tagline">{props.tagline}</p>}
            <div className="sg-footer__badge"><span className="lv" />Booking now</div>
          </div>

          <div className="sg-footer__col">
            <h4>Contact</h4>
            <ul>
              {props.contact_email && <li>{props.contact_email}</li>}
              {props.contact_phone && <li>{props.contact_phone}</li>}
              {props.address && <li>{props.address}</li>}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((s, idx) => (
                <li key={s.id || idx}>
                  {s.href ? <a href={s.href}>{s.platform || ''}</a> : (s.platform || '')}
                </li>
              ))}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>Studio</h4>
            <ul>
              <li>About</li>
              <li>Work</li>
              <li>Clients</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>

        <div className="sg-footer__bottom">
          <span>{props.copyright || ''}</span>
          <span>Built with Lessgo</span>
        </div>
      </footer>
    </>
  );
}

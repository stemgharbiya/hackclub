import Icon from '@hackclub/icons';

export default function HackClubIconWrapper({ glyph, size, className }) {
  return (
    <Icon 
      glyph={glyph}
      size={size}
      className={className}
    />
  );
}

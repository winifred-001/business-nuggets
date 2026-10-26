export default function PageNotice({ text }: { text: string }) {
  return text ? <p className="mb-8 whitespace-pre-wrap rounded-lg border border-[#cda762]/30 bg-[#cda762]/10 p-5 text-sm leading-7 text-[#ead2a0]">{text}</p> : null;
}

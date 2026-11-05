export default function PageNotice({ text }: { text: string }) {
  return text ? <p className="mb-8 whitespace-pre-wrap rounded-lg border border-[#E28906]/30 bg-[#E28906]/10 p-5 text-sm leading-7 text-[#E28906]">{text}</p> : null;
}

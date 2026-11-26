export default function PageNotice({ text, light = false }: { text: string; light?: boolean }) {
  return text ? <p className={`mb-8 whitespace-pre-wrap rounded-lg border border-[#E28906]/30 bg-[#E28906]/10 p-5 text-sm leading-7 ${light ? "text-[#79500A]" : "text-[#E28906]"}`}>{text}</p> : null;
}

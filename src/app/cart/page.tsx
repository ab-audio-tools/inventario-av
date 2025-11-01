import CartDrawer from "@/components/CartDrawer";
import PageFade from "@/components/PageFade";
export default function CartPage() {
  return (
    <PageFade>
      <div className="max-w-5xl mx-auto">
        <CartDrawer />
      </div>
    </PageFade>
  );
}